import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Ban, Bell, Calendar, ChevronRight, FileText, Flag, Hash, Settings, Shield, Users, VolumeX } from 'lucide-react-native'
import { supabase } from '@/services/supabase'
import { Colors, Radii, Spacing } from '@/constants/theme'
import { AppButton } from '@/components/primitives/AppButton'
import { AppText } from '@/components/primitives/AppText'
import { Card } from '@/components/primitives/Card'

type AdminSection = 'requests' | 'members' | 'channels' | 'rules' | 'announcements' | 'reports' | 'muted' | 'banned' | 'events' | 'settings'
type AdminRow = { id: string; userId?: string; title: string; subtitle?: string; role?: string; status?: string }

const SECTION_LABELS: Record<AdminSection, string> = {
  requests: 'Join Requests', members: 'Members & Roles', channels: 'Channels', rules: 'Community Rules',
  announcements: 'Announcements', reports: 'Reports & Flagged Content', muted: 'Muted Users',
  banned: 'Banned Users', events: 'Community Events', settings: 'General Settings',
}

export default function CommunityAdminScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [communityName, setCommunityName] = useState('Community')
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sectionLoading, setSectionLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState<AdminSection | null>(null)
  const [rows, setRows] = useState<AdminRow[]>([])
  const [editorText, setEditorText] = useState('')
  const [approvalRequired, setApprovalRequired] = useState(false)

  const loadAccess = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setRole(null); setLoading(false); return }
    const [community, membership] = await Promise.all([
      (supabase as any).from('communities').select('community_name, rules, approval_required').eq('id', id).maybeSingle(),
      (supabase as any).from('community_members').select('role, status').eq('community_id', id).eq('user_id', auth.user.id).maybeSingle(),
    ])
    setCommunityName(community.data?.community_name || 'Community')
    setEditorText(community.data?.rules || '')
    setApprovalRequired(Boolean(community.data?.approval_required))
    const memberRole = membership.data?.status === 'active' ? membership.data?.role : null
    setRole(['owner', 'admin', 'moderator'].includes(memberRole) ? memberRole : null)
    setLoading(false)
  }, [id])

  useEffect(() => { loadAccess() }, [loadAccess])

  const attachProfiles = async (data: any[], userKey = 'user_id') => {
    const ids = Array.from(new Set(data.map((item) => item[userKey]).filter(Boolean))) as string[]
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', ids)
      : { data: [] as any[] }
    const names = new Map((profiles || []).map((profile: any) => [profile.user_id, `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Member']))
    return data.map((item) => ({ ...item, profileName: names.get(item[userKey]) || 'Member' }))
  }

  const loadSection = async (nextSection: AdminSection) => {
    if (!id) return
    setSelectedSection(nextSection); setSectionLoading(true); setRows([])
    try {
      if (nextSection === 'requests') {
        const { data, error } = await (supabase as any).from('community_join_requests').select('*').eq('community_id', id).eq('status', 'pending').order('created_at')
        if (error) throw error
        const enriched = await attachProfiles(data || [])
        setRows(enriched.map((item: any) => ({ id: item.id, userId: item.user_id, title: item.profileName, subtitle: 'Waiting for approval' })))
      } else if (['members', 'muted', 'banned'].includes(nextSection)) {
        let query = (supabase as any).from('community_members').select('id, user_id, role, status, muted_until, joined_at').eq('community_id', id)
        query = nextSection === 'members' ? query.eq('status', 'active') : query.eq('status', nextSection === 'muted' ? 'muted' : 'banned')
        const { data, error } = await query.order('joined_at')
        if (error) throw error
        const enriched = await attachProfiles(data || [])
        setRows(enriched.map((item: any) => ({ id: item.id, userId: item.user_id, title: item.profileName, subtitle: item.status, role: item.role, status: item.status })))
      } else if (nextSection === 'channels') {
        const { data, error } = await (supabase as any).from('community_channels').select('id, name, description, channel_type').eq('community_id', id).order('position')
        if (error) throw error
        setRows((data || []).map((item: any) => ({ id: item.id, title: `# ${item.name}`, subtitle: item.description || item.channel_type }))); setEditorText('')
      } else if (nextSection === 'rules') {
        const { data, error } = await (supabase as any).from('communities').select('rules').eq('id', id).single()
        if (error) throw error
        setEditorText(data?.rules || '')
      } else if (nextSection === 'announcements') {
        const { data, error } = await (supabase as any).from('community_messages').select('id, content, created_at').eq('community_id', id).eq('message_type', 'announcement').order('created_at', { ascending: false }).limit(20)
        if (error) throw error
        setRows((data || []).map((item: any) => ({ id: item.id, title: item.content, subtitle: new Date(item.created_at).toLocaleDateString() }))); setEditorText('')
      } else if (nextSection === 'reports') {
        const { data, error } = await (supabase as any).from('reports').select('id, reason, report_type, status, created_at').eq('community_id', id).order('created_at', { ascending: false })
        if (error) throw error
        setRows((data || []).map((item: any) => ({ id: item.id, title: item.reason, subtitle: item.report_type, status: item.status })))
      } else if (nextSection === 'events') {
        const { data, error } = await (supabase as any).from('events').select('id, name, event_date, location').eq('community_id', id).order('event_date')
        if (error) throw error
        setRows((data || []).map((item: any) => ({ id: item.id, title: item.name, subtitle: `${item.event_date || ''} · ${item.location || 'Location pending'}` })))
      } else if (nextSection === 'settings') {
        const { data, error } = await (supabase as any).from('communities').select('approval_required').eq('id', id).single()
        if (error) throw error
        setApprovalRequired(Boolean(data?.approval_required))
      }
    } catch (error: any) { Alert.alert('Could Not Load', error?.message || 'Please try again.') }
    finally { setSectionLoading(false) }
  }

  const resolveRequest = async (requestId: string, approve: boolean) => {
    const { error } = await (supabase as any).rpc('resolve_community_join_request', { p_request_id: requestId, p_approve: approve })
    if (error) return Alert.alert('Could Not Update Request', error.message)
    setRows((current) => current.filter((item) => item.id !== requestId))
  }

  const moderateMember = async (row: AdminRow, action: string) => {
    if (!row.userId || !id) return
    const { error } = await (supabase as any).rpc('moderate_community_member', { p_community_id: id, p_target_user_id: row.userId, p_action: action, p_reason: 'Community admin action' })
    if (error) return Alert.alert('Could Not Update Member', error.message)
    await loadSection(selectedSection || 'members')
  }

  const saveRules = async () => {
    const { error } = await (supabase as any).from('communities').update({ rules: editorText.trim() }).eq('id', id)
    Alert.alert(error ? 'Could Not Save' : 'Rules Saved', error?.message || 'Members will see the updated community rules.')
  }

  const createChannel = async () => {
    const name = editorText.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
    if (!name) return
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await (supabase as any).from('community_channels').insert({ community_id: id, name, channel_type: 'topic', created_by: auth.user?.id })
    if (error) return Alert.alert('Could Not Create Channel', error.message)
    setEditorText(''); await loadSection('channels')
  }

  const publishAnnouncement = async () => {
    if (!editorText.trim()) return
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await (supabase as any).from('community_messages').insert({ community_id: id, sender_id: auth.user?.id, content: editorText.trim(), message_type: 'announcement' })
    if (error) return Alert.alert('Could Not Publish', error.message)
    setEditorText(''); await loadSection('announcements')
  }

  const setReportResolved = async (reportId: string) => {
    const { error } = await (supabase as any).from('reports').update({ status: 'resolved', resolution_note: 'Reviewed in community moderation dashboard', reviewed_at: new Date().toISOString() }).eq('id', reportId)
    if (error) return Alert.alert('Could Not Resolve Report', error.message)
    setRows((current) => current.map((item) => item.id === reportId ? { ...item, status: 'resolved' } : item))
  }

  const toggleApproval = async () => {
    const next = !approvalRequired
    const { error } = await (supabase as any).from('communities').update({ approval_required: next }).eq('id', id)
    if (error) return Alert.alert('Could Not Save', error.message)
    setApprovalRequired(next)
  }

  const adminSections: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'requests', label: 'Join Requests', icon: <Users color={Colors.primary} size={20} /> },
    { id: 'members', label: 'Members & Roles', icon: <Shield color={Colors.sage} size={20} /> },
    { id: 'channels', label: 'Channels', icon: <Hash color={Colors.amber} size={20} /> },
    { id: 'rules', label: 'Community Rules', icon: <FileText color={Colors.primary} size={20} /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell color={Colors.coral} size={20} /> },
    { id: 'reports', label: 'Reports & Flagged Content', icon: <Flag color={Colors.coral} size={20} /> },
    { id: 'muted', label: 'Muted Users', icon: <VolumeX color={Colors.textSecondary} size={20} /> },
    { id: 'banned', label: 'Banned Users', icon: <Ban color={Colors.danger} size={20} /> },
    { id: 'events', label: 'Community Events', icon: <Calendar color={Colors.amber} size={20} /> },
    { id: 'settings', label: 'General Settings', icon: <Settings color={Colors.textSecondary} size={20} /> },
  ]

  const renderSection = () => {
    if (!selectedSection) return null
    if (sectionLoading) return <ActivityIndicator color={Colors.primary} style={styles.loader} />
    const isEditor = ['channels', 'rules', 'announcements'].includes(selectedSection)
    return <View style={styles.sectionContent}>
      {isEditor ? <Card style={styles.editorCard}>
        <TextInput value={editorText} onChangeText={setEditorText} multiline={selectedSection !== 'channels'} placeholder={selectedSection === 'channels' ? 'New channel name' : selectedSection === 'rules' ? 'Write clear community rules…' : 'Write an important announcement…'} placeholderTextColor={Colors.textMuted} style={[styles.editorInput, selectedSection !== 'channels' && styles.editorInputLarge]} />
        <AppButton title={selectedSection === 'channels' ? 'Create Channel' : selectedSection === 'rules' ? 'Save Rules' : 'Publish Announcement'} onPress={selectedSection === 'channels' ? createChannel : selectedSection === 'rules' ? saveRules : publishAnnouncement} />
      </Card> : null}
      {selectedSection === 'settings' ? <TouchableOpacity onPress={toggleApproval} style={styles.settingRow}><View style={{ flex: 1 }}><AppText variant="bodySm" weight="bold">Approval required</AppText><AppText variant="caption" color={Colors.textSecondary}>Review each membership request before entry.</AppText></View><AppText variant="bodySm" weight="bold" color={approvalRequired ? Colors.success : Colors.textMuted}>{approvalRequired ? 'ON' : 'OFF'}</AppText></TouchableOpacity> : null}
      {rows.length === 0 && !isEditor && selectedSection !== 'settings' ? <Card style={styles.emptyCard}><AppText variant="bodySm" color={Colors.textSecondary}>Nothing needs attention here.</AppText></Card> : rows.map((row) => <Card key={row.id} style={styles.dataCard}>
        <View style={{ flex: 1, gap: 3 }}><AppText variant="bodySm" weight="bold">{row.title}</AppText>{row.subtitle ? <AppText variant="caption" color={Colors.textSecondary}>{row.subtitle}</AppText> : null}{row.role ? <AppText variant="caption" color={Colors.primary}>{row.role}</AppText> : null}{row.status ? <AppText variant="caption" color={row.status === 'resolved' ? Colors.success : Colors.amber}>{row.status}</AppText> : null}</View>
        {selectedSection === 'requests' ? <View style={styles.actions}><AppButton title="Approve" size="sm" onPress={() => resolveRequest(row.id, true)} /><AppButton title="Decline" size="sm" variant="outline" onPress={() => resolveRequest(row.id, false)} /></View>
          : selectedSection === 'members' && row.role !== 'owner' ? <View style={styles.actions}><AppButton title={row.role === 'moderator' ? 'Make Member' : 'Make Mod'} size="sm" variant="outline" onPress={() => moderateMember(row, row.role === 'moderator' ? 'make_member' : 'make_moderator')} /><AppButton title="Mute" size="sm" variant="outline" onPress={() => moderateMember(row, 'mute')} /><AppButton title="Remove" size="sm" variant="danger" onPress={() => moderateMember(row, 'remove')} /></View>
          : selectedSection === 'muted' ? <AppButton title="Unmute" size="sm" onPress={() => moderateMember(row, 'unban')} />
          : selectedSection === 'banned' ? <AppButton title="Unban" size="sm" onPress={() => moderateMember(row, 'unban')} />
          : selectedSection === 'reports' && row.status !== 'resolved' ? <AppButton title="Resolve" size="sm" onPress={() => setReportResolved(row.id)} />
          : selectedSection === 'events' ? <AppButton title="View" size="sm" variant="outline" onPress={() => router.push(`/event/${row.id}`)} /> : null}
      </Card>)}
    </View>
  }

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>
  if (!role) return <SafeAreaView style={styles.center}><Shield color={Colors.danger} size={48} /><AppText variant="h3" weight="bold">Access Denied</AppText><AppText variant="bodySm" color={Colors.textSecondary} align="center">Only community owners, admins, and moderators can access these controls.</AppText><AppButton title="Go Back" onPress={() => router.back()} /></SafeAreaView>

  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.header}><TouchableOpacity onPress={() => selectedSection ? setSelectedSection(null) : router.back()} style={styles.backBtn}><ArrowLeft color={Colors.text} size={22} /></TouchableOpacity><View style={{ flex: 1 }}><AppText variant="h3" weight="bold">{selectedSection ? SECTION_LABELS[selectedSection] : 'Community Admin'}</AppText><AppText variant="caption" color={Colors.textSecondary}>{communityName} · {role}</AppText></View></View>
    <ScrollView contentContainerStyle={styles.scrollContent}>{selectedSection ? renderSection() : <View style={styles.menuContainer}>{adminSections.map((item) => <TouchableOpacity key={item.id} onPress={() => loadSection(item.id)} style={styles.menuRow}><View style={styles.menuLeft}><View style={styles.iconCircle}>{item.icon}</View><AppText variant="bodySm" weight="medium">{item.label}</AppText></View><ChevronRight color={Colors.textMuted} size={18} /></TouchableOpacity>)}</View>}</ScrollView>
  </SafeAreaView>
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background }, center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  menuContainer: { backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 }, iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  loader: { marginTop: 48 }, sectionContent: { gap: 12 }, editorCard: { padding: Spacing.md, gap: 12 },
  editorInput: { minHeight: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: 12, color: Colors.text, backgroundColor: Colors.background },
  editorInputLarge: { minHeight: 130, textAlignVertical: 'top' }, dataCard: { padding: Spacing.md, gap: 12 }, emptyCard: { padding: Spacing.lg, alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, minHeight: 68, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, backgroundColor: Colors.surface },
})
