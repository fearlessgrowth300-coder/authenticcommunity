import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user with their token
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to delete user data and auth account
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete profile (cascading will handle related data)
    await adminClient.from("profiles").delete().eq("user_id", user.id);
    await adminClient.from("notification_settings").delete().eq("user_id", user.id);
    await adminClient.from("blocked_users").delete().eq("blocker_id", user.id);
    await adminClient.from("user_interests").delete().eq("user_id", user.id);
    await adminClient.from("user_values").delete().eq("user_id", user.id);
    await adminClient.from("connections").delete().or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
    await adminClient.from("matches").delete().or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
    await adminClient.from("messages").delete().or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
    await adminClient.from("notifications").delete().eq("user_id", user.id);

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
