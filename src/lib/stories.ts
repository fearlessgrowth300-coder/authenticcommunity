import { supabase } from "@/integrations/supabase/client";

export async function createTextStory(text: string, backgroundColor: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("stories")
    .insert({ user_id: user.id, content_type: "text", text_content: text, background_color: backgroundColor })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createImageStory(imageFile: File) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileName = `${user.id}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from("stories").upload(fileName, imageFile);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(fileName);

  const { data, error } = await supabase
    .from("stories")
    .insert({ user_id: user.id, content_type: "image", content_url: publicUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createVideoStory(videoFile: File) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileName = `${user.id}/${Date.now()}.mp4`;
  const { error: uploadError } = await supabase.storage.from("stories").upload(fileName, videoFile);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(fileName);

  const { data, error } = await supabase
    .from("stories")
    .insert({ user_id: user.id, content_type: "video", content_url: publicUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getActiveStories() {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_deleted", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  // Get unique user_ids and fetch profiles
  const userIds = [...new Set((data || []).map((s: any) => s.user_id))];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, profile_image_url")
    .in("user_id", userIds);

  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

  return (data || [])
    .map((s: any) => ({
      ...s,
      profile: profileMap.get(s.user_id) || null,
    }))
    .filter((s: any) => !!s.profile);
}

export async function recordStoryView(storyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("story_views").insert({ story_id: storyId, viewer_id: user.id }).select();
}

export async function likeStory(storyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("story_likes").insert({ story_id: storyId, user_id: user.id });
  if (error && error.code !== "23505") throw error;
}

export async function unlikeStory(storyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("story_likes").delete().eq("story_id", storyId).eq("user_id", user.id);
}

export async function checkIfLiked(storyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("story_likes").select("id").eq("story_id", storyId).eq("user_id", user.id).maybeSingle();
  return !!data;
}

export async function replyToStory(storyId: string, message: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("story_replies")
    .insert({ story_id: storyId, user_id: user.id, message })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getStoryReplies(storyId: string) {
  const { data, error } = await supabase
    .from("story_replies")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, profile_image_url")
    .in("user_id", userIds);

  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

  return (data || []).map((r: any) => ({ ...r, profile: profileMap.get(r.user_id) || null }));
}

export async function deleteStoryReply(replyId: string) {
  await supabase.from("story_replies").delete().eq("id", replyId);
}

export async function getStoryViewers(storyId: string) {
  const { data, error } = await supabase
    .from("story_views")
    .select("*")
    .eq("story_id", storyId)
    .order("viewed_at", { ascending: false });
  if (error) throw error;

  const viewerIds = [...new Set((data || []).map((v: any) => v.viewer_id))];
  if (viewerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, profile_image_url")
    .in("user_id", viewerIds);

  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

  return (data || []).map((v: any) => ({ ...v, profile: profileMap.get(v.viewer_id) || null }));
}

export async function deleteStory(storyId: string) {
  await supabase.from("stories").update({ is_deleted: true }).eq("id", storyId);
}

export async function shareStory(storyId: string) {
  const storyUrl = `${window.location.origin}/stories/${storyId}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Check out this story!", text: "I found an interesting story", url: storyUrl });
    } catch { /* cancelled */ }
  } else {
    await navigator.clipboard.writeText(storyUrl);
  }
}

export function shareStoryTo(storyId: string, platform: string) {
  const storyUrl = `${window.location.origin}/stories/${storyId}`;
  const text = "Check out this story!";
  const urls: Record<string, string | null> = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + storyUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(storyUrl)}`,
    email: `mailto:?subject=Check out this story&body=${encodeURIComponent(text + "\n" + storyUrl)}`,
    copy: null,
  };
  if (platform === "copy") {
    navigator.clipboard.writeText(storyUrl);
  } else if (urls[platform]) {
    window.open(urls[platform]!, "_blank");
  }
}
