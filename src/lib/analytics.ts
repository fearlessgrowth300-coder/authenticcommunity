import { supabase } from "@/integrations/supabase/client";

/** Best-effort, privacy-conscious product telemetry. Never block a member action. */
export async function track(eventName: string, properties: Record<string, unknown> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from("analytics_events").insert({
      user_id: user.id,
      event_name: eventName,
      properties,
    });
  } catch {
    // Telemetry must not affect the member experience.
  }
}

export async function reportClientError(error: unknown, context: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const message = error instanceof Error ? error.message : String(error);
    await (supabase as any).from("client_errors").insert({
      user_id: user?.id ?? null,
      context,
      message: message.slice(0, 1000),
      path: window.location.pathname,
    });
  } catch {
    // Avoid an error-reporting loop.
  }
}
