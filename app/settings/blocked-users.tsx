import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Ban } from 'lucide-react-native'
import { supabase } from '@/services/supabase'
import { Colors, Radii, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'

type BlockedMember = { id: string; userId: string; name: string; avatar: string | null }

export default function BlockedUsersScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<BlockedMember[]>([])

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return setLoading(false)
    const { data, error } = await (supabase as any).from('blocked_users').select('id, blocked_id').eq('blocker_id', auth.user.id)
    if (error) { Alert.alert('Could Not Load', error.message); return setLoading(false) }
    const ids = (data || []).map((item: any) => item.blocked_id)
    const { data: profiles } = ids.length ? await supabase.from('profiles').select('user_id, first_name, last_name, profile_image_url').in('user_id', ids) : { data: [] as any[] }
    const profileMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]))
    setMembers((data || []).map((item: any) => { const profile = profileMap.get(item.blocked_id) as any; return { id: item.id, userId: item.blocked_id, name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Member', avatar: profile?.profile_image_url || null } }))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const unblock = async (member: BlockedMember) => {
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await (supabase as any).from('blocked_users').delete().eq('blocker_id', auth.user?.id).eq('blocked_id', member.userId)
    if (error) return Alert.alert('Could Not Unblock', error.message)
    setMembers((current) => current.filter((item) => item.id !== member.id))
  }

  return <SafeAreaView style={styles.safeArea}><View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft color={Colors.text} size={22} /></TouchableOpacity><AppText variant="h3" weight="bold">Blocked Users</AppText><View style={styles.back} /></View><ScrollView contentContainerStyle={styles.content}>{loading ? <ActivityIndicator color={Colors.primary} /> : members.length ? members.map((member) => <View key={member.id} style={styles.row}>{member.avatar ? <Image source={{ uri: member.avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Ban color={Colors.textMuted} size={20} /></View>}<View style={{ flex: 1 }}><AppText variant="bodySm" weight="bold">{member.name}</AppText><AppText variant="caption" color={Colors.textSecondary}>Cannot message or interact with you</AppText></View><AppButton title="Unblock" size="sm" variant="outline" onPress={() => unblock(member)} /></View>) : <View style={styles.empty}><Ban color={Colors.textMuted} size={42} /><AppText variant="bodySm" weight="bold">No blocked users</AppText><AppText variant="caption" color={Colors.textSecondary}>People you block will appear here.</AppText></View>}</ScrollView></SafeAreaView>
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, content: { padding: Spacing.md, gap: 10 }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border }, avatar: { width: 44, height: 44, borderRadius: 22 }, avatarFallback: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }, empty: { alignItems: 'center', gap: 8, paddingTop: 60 } })
