import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, VolumeX } from 'lucide-react-native'
import { supabase } from '@/services/supabase'
import { Colors, Radii, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'

type MutedMember = { id: string; userId: string; name: string; avatar: string | null }

export default function MutedUsersScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<MutedMember[]>([])
  const load = async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return setLoading(false)
    const { data, error } = await (supabase as any).from('conversation_settings').select('id, other_user_id').eq('user_id', auth.user.id).eq('is_muted', true).not('other_user_id', 'is', null)
    if (error) { Alert.alert('Could Not Load', error.message); return setLoading(false) }
    const ids = (data || []).map((item: any) => item.other_user_id)
    const { data: profiles } = ids.length ? await supabase.from('profiles').select('user_id, first_name, last_name, profile_image_url').in('user_id', ids) : { data: [] as any[] }
    const profileMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]))
    setMembers((data || []).map((item: any) => { const profile = profileMap.get(item.other_user_id) as any; return { id: item.id, userId: item.other_user_id, name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Member', avatar: profile?.profile_image_url || null } }))
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const unmute = async (member: MutedMember) => { const { error } = await (supabase as any).from('conversation_settings').update({ is_muted: false }).eq('id', member.id); if (error) return Alert.alert('Could Not Unmute', error.message); setMembers((current) => current.filter((item) => item.id !== member.id)) }
  return <SafeAreaView style={styles.safeArea}><View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft color={Colors.text} size={22} /></TouchableOpacity><AppText variant="h3" weight="bold">Muted Users</AppText><View style={styles.back} /></View><ScrollView contentContainerStyle={styles.content}>{loading ? <ActivityIndicator color={Colors.primary} /> : members.length ? members.map((member) => <View key={member.id} style={styles.row}>{member.avatar ? <Image source={{ uri: member.avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><VolumeX color={Colors.textMuted} size={20} /></View>}<View style={{ flex: 1 }}><AppText variant="bodySm" weight="bold">{member.name}</AppText><AppText variant="caption" color={Colors.textSecondary}>Conversation notifications muted</AppText></View><AppButton title="Unmute" size="sm" variant="outline" onPress={() => unmute(member)} /></View>) : <View style={styles.empty}><VolumeX color={Colors.textMuted} size={42} /><AppText variant="bodySm" weight="bold">No muted users</AppText><AppText variant="caption" color={Colors.textSecondary}>Muted conversations will appear here.</AppText></View>}</ScrollView></SafeAreaView>
}
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: Colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, content: { padding: Spacing.md, gap: 10 }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border }, avatar: { width: 44, height: 44, borderRadius: 22 }, avatarFallback: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }, empty: { alignItems: 'center', gap: 8, paddingTop: 60 } })
