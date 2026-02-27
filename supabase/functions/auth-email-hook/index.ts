import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_NAME = "Authentic Community";
const SITE_URL = "https://authenticcommunity.lovable.app";
const FROM_EMAIL = "Authentic Community <noreply@authenticcommunity.fun>";

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: "Your verification code for Authentic Community",
  recovery: "Reset your password — Authentic Community",
  magiclink: "Your login link — Authentic Community",
  invite: "You've been invited to Authentic Community",
  email_change: "Confirm your new email — Authentic Community",
  reauthentication: "Your verification code",
  auth: "Your verification code for Authentic Community",
};

function buildSignupHtml(token: string, email: string, confirmationUrl: string): string {
  const hasLink = confirmationUrl && confirmationUrl.length > 10;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:20px;font-weight:bold;color:hsl(217,91%,60%);">🌟 Authentic Community</span>
  </div>
  <h1 style="font-size:24px;font-weight:bold;color:hsl(222,20%,10%);margin:0 0 16px;">Verify your email</h1>
  <p style="font-size:15px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Thanks for joining <a href="${SITE_URL}" style="color:hsl(217,91%,60%);text-decoration:underline;"><strong>Authentic Community</strong></a>
    — we're excited to help you find genuine connections, meaningful friendships, and communities that feel like home.
  </p>
  <p style="font-size:15px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Click the button below to verify your email (${email}):
  </p>
  ${hasLink ? `<div style="text-align:center;margin:32px 0;">
    <a href="${confirmationUrl}" style="display:inline-block;background:hsl(217,91%,60%);color:#ffffff;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none;">Verify Email</a>
  </div>
  <p style="font-size:13px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Or copy and paste this link into your browser:<br/>
    <a href="${confirmationUrl}" style="color:hsl(217,91%,60%);word-break:break-all;">${confirmationUrl}</a>
  </p>` : `<div style="background:#f3f4f6;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
    <p style="font-size:13px;color:hsl(220,10%,46%);margin:0 0 12px;">Your Verification Code</p>
    <p style="font-family:'Courier New',monospace;font-size:42px;font-weight:bold;color:hsl(217,91%,60%);letter-spacing:8px;margin:0 0 12px;">${token || "------"}</p>
    <p style="font-size:13px;color:#ef4444;margin:0;">⏱️ This code expires in 15 minutes</p>
  </div>`}
  <div style="background:hsl(217,91%,95%);border-left:4px solid hsl(217,91%,60%);padding:12px 16px;border-radius:4px;margin:20px 0;">
    <p style="font-size:13px;color:hsl(217,91%,35%);margin:0;">🔒 This verification link expires in 15 minutes.</p>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
  <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;">If you didn't create an account, you can safely ignore this email.</p>
  <p style="font-size:12px;color:#9ca3af;text-align:center;">© Authentic Community</p>
</div>
</body>
</html>`;
}

function buildRecoveryHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:20px;font-weight:bold;color:hsl(217,91%,60%);">🌟 Authentic Community</span>
  </div>
  <h1 style="font-size:24px;font-weight:bold;color:hsl(222,20%,10%);margin:0 0 16px;">Reset your password</h1>
  <p style="font-size:15px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    We received a request to reset your password. Click the button below to choose a new one.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:hsl(217,91%,60%);color:#ffffff;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none;">Reset Password</a>
  </div>
  <p style="font-size:13px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Or copy and paste this link into your browser:<br/>
    <a href="${url}" style="color:hsl(217,91%,60%);word-break:break-all;">${url}</a>
  </p>
  <div style="background:hsl(217,91%,95%);border-left:4px solid hsl(217,91%,60%);padding:12px 16px;border-radius:4px;margin:20px 0;">
    <p style="font-size:13px;color:hsl(217,91%,35%);margin:0;">🔒 This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
  <p style="font-size:12px;color:#9ca3af;text-align:center;">© Authentic Community</p>
</div>
</body>
</html>`;
}

function buildMagicLinkHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:20px;font-weight:bold;color:hsl(217,91%,60%);">🌟 Authentic Community</span>
  </div>
  <h1 style="font-size:24px;font-weight:bold;color:hsl(222,20%,10%);margin:0 0 16px;">Your login link</h1>
  <p style="font-size:15px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Click the button below to sign in to Authentic Community.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:hsl(217,91%,60%);color:#ffffff;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none;">Sign In</a>
  </div>
  <p style="font-size:13px;color:hsl(220,10%,46%);">This link expires in 1 hour.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
  <p style="font-size:12px;color:#9ca3af;text-align:center;">© Authentic Community</p>
</div>
</body>
</html>`;
}

function buildInviteHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:20px;font-weight:bold;color:hsl(217,91%,60%);">🌟 Authentic Community</span>
  </div>
  <h1 style="font-size:24px;font-weight:bold;color:hsl(222,20%,10%);margin:0 0 16px;">You've been invited!</h1>
  <p style="font-size:15px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Someone invited you to join Authentic Community — a place for genuine connections and meaningful friendships.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:hsl(217,91%,60%);color:#ffffff;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none;">Accept Invitation</a>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
  <p style="font-size:12px;color:#9ca3af;text-align:center;">© Authentic Community</p>
</div>
</body>
</html>`;
}

function buildEmailChangeHtml(url: string, newEmail: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:20px;font-weight:bold;color:hsl(217,91%,60%);">🌟 Authentic Community</span>
  </div>
  <h1 style="font-size:24px;font-weight:bold;color:hsl(222,20%,10%);margin:0 0 16px;">Confirm your new email</h1>
  <p style="font-size:15px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Click the button below to confirm changing your email to <strong>${newEmail}</strong>.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:hsl(217,91%,60%);color:#ffffff;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none;">Confirm Email Change</a>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
  <p style="font-size:12px;color:#9ca3af;text-align:center;">© Authentic Community</p>
</div>
</body>
</html>`;
}

function buildReauthHtml(token: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:20px;font-weight:bold;color:hsl(217,91%,60%);">🌟 Authentic Community</span>
  </div>
  <h1 style="font-size:24px;font-weight:bold;color:hsl(222,20%,10%);margin:0 0 16px;">Verification code</h1>
  <p style="font-size:15px;color:hsl(220,10%,46%);line-height:1.6;margin:0 0 20px;">
    Use this code to verify your identity:
  </p>
  <div style="background:#f3f4f6;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
    <p style="font-family:'Courier New',monospace;font-size:42px;font-weight:bold;color:hsl(217,91%,60%);letter-spacing:8px;margin:0;">${token}</p>
  </div>
  <p style="font-size:13px;color:hsl(220,10%,46%);">This code expires in 15 minutes.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
  <p style="font-size:12px;color:#9ca3af;text-align:center;">© Authentic Community</p>
</div>
</body>
</html>`;
}

// Build HTML based on email type
function buildEmailHtml(type: string, data: Record<string, any>): string {
  switch (type) {
    case "signup":
      return buildSignupHtml(data.token || "", data.email || "", data.confirmation_url || data.url || "");
    case "recovery":
      return buildRecoveryHtml(data.confirmation_url || data.url || SITE_URL);
    case "magiclink":
      return buildMagicLinkHtml(data.confirmation_url || data.url || SITE_URL);
    case "invite":
      return buildInviteHtml(data.confirmation_url || data.url || SITE_URL);
    case "email_change":
      return buildEmailChangeHtml(data.confirmation_url || data.url || SITE_URL, data.new_email || "");
    case "reauthentication":
      return buildReauthHtml(data.token || "");
    default:
      return buildSignupHtml(data.token || "", data.email || "", data.confirmation_url || data.url || "");
  }
}

// Plain text version
function buildPlainText(type: string, data: Record<string, any>): string {
  switch (type) {
    case "signup":
      return `Authentic Community — Verify your email\n\nClick this link to verify your email:\n${data.confirmation_url || data.url || SITE_URL}\n\nThis link expires in 15 minutes.\n\nIf you didn't create an account, ignore this email.`;
    case "recovery":
      return `Authentic Community — Reset your password\n\nClick this link to reset your password:\n${data.confirmation_url || data.url || SITE_URL}\n\nThis link expires in 1 hour.`;
    case "magiclink":
      return `Authentic Community — Your login link\n\nClick this link to sign in:\n${data.confirmation_url || data.url || SITE_URL}\n\nThis link expires in 1 hour.`;
    case "invite":
      return `You've been invited to Authentic Community!\n\nAccept your invitation:\n${data.confirmation_url || data.url || SITE_URL}`;
    case "email_change":
      return `Authentic Community — Confirm your new email\n\nConfirm changing to ${data.new_email}:\n${data.confirmation_url || data.url || SITE_URL}`;
    case "reauthentication":
      return `Authentic Community — Your verification code: ${data.token || ""}`;
    default:
      return `Authentic Community notification`;
  }
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "string" && first.trim().length > 0) {
        return first.trim();
      }
    }
  }

  return "";
}

function pickVerificationToken(entries: Array<[string, unknown]>): { value: string; source: string } {
  const resolved = entries
    .map(([source, value]) => ({ source, value: firstNonEmptyString(value) }))
    .filter((entry) => entry.value.length > 0);

  const sixDigitOtp = resolved.find((entry) => /^\d{6}$/.test(entry.value));
  if (sixDigitOtp) return sixDigitOtp;

  const shortCode = resolved.find((entry) => /^[A-Za-z0-9]{6,8}$/.test(entry.value));
  if (shortCode) return shortCode;

  return resolved[0] ?? { value: "", source: "" };
}

function tokenFromUrl(value: string): string {
  if (!value) return "";

  try {
    const parsed = new URL(value);
    return firstNonEmptyString(
      parsed.searchParams.get("token"),
      parsed.searchParams.get("otp"),
      parsed.searchParams.get("code"),
    );
  } catch {
    return "";
  }
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<{ id?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error("Resend API error", { status: res.status, body });
    throw new Error(`Resend error [${res.status}]: ${JSON.stringify(body)}`);
  }

  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as Record<string, any>;
    const data = (payload.data ?? {}) as Record<string, any>;
    const emailData = (payload.email_data ?? data.email_data ?? {}) as Record<string, any>;
    const user = (payload.user ?? data.user ?? {}) as Record<string, any>;
    
    // Support direct calls, webhook payloads, and auth hook payloads
    const emailType = firstNonEmptyString(
      payload.type,
      payload.action_type,
      data.action_type,
      payload.email_action_type,
      emailData.email_action_type,
      emailData.action_type,
      "signup",
    );

    const email = firstNonEmptyString(
      payload.email,
      data.email,
      user.email,
      payload.recipient,
      data.recipient,
      emailData.email,
      emailData.recipient,
      payload.to,
      data.to,
    );

    const url = firstNonEmptyString(
      payload.confirmation_url,
      payload.url,
      payload.action_link,
      data.confirmation_url,
      data.url,
      data.action_link,
      emailData.confirmation_url,
      emailData.action_link,
      emailData.url,
    );

    const actionLink = firstNonEmptyString(
      payload.action_link,
      data.action_link,
      emailData.action_link,
    );

    const pickedToken = pickVerificationToken([
      ["email_data.otp", emailData.otp],
      ["email_data.code", emailData.code],
      ["email_data.token", emailData.token],
      ["data.otp", data.otp],
      ["data.code", data.code],
      ["data.token", data.token],
      ["payload.otp", payload.otp],
      ["payload.code", payload.code],
      ["payload.token", payload.token],
      ["url.token", tokenFromUrl(url)],
      ["action_link.token", tokenFromUrl(actionLink)],
    ]);

    const token = pickedToken.value;

    const newEmail = firstNonEmptyString(
      payload.new_email,
      data.new_email,
      user.new_email,
      emailData.new_email,
    );

    const providedSubject = firstNonEmptyString(
      payload.subject,
      data.subject,
      emailData.subject,
    );

    const providedHtml = firstNonEmptyString(
      payload.html,
      payload.body_html,
      payload.bodyHtml,
      data.html,
      data.body_html,
      data.bodyHtml,
      emailData.html,
      emailData.body_html,
      emailData.bodyHtml,
    );

    const providedText = firstNonEmptyString(
      payload.text,
      payload.body_text,
      payload.bodyText,
      data.text,
      data.body_text,
      data.bodyText,
      emailData.text,
      emailData.body_text,
      emailData.bodyText,
    );

    console.log("Processing auth email", {
      emailType,
      email,
      tokenLength: token.length,
      tokenSource: pickedToken.source,
      urlPresent: Boolean(url),
      hasProvidedHtml: Boolean(providedHtml),
      hasProvidedText: Boolean(providedText),
    });

    if (!email) {
      console.error("Auth email payload missing recipient", {
        emailType,
        payloadKeys: Object.keys(payload ?? {}),
        dataKeys: Object.keys(data ?? {}),
        userKeys: Object.keys(user ?? {}),
        emailDataKeys: Object.keys(emailData ?? {}),
      });

      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateType = emailType === "auth" ? "signup" : emailType;
    const emailTemplateData = { email, token, confirmation_url: url, url, new_email: newEmail };
    const subject = providedSubject || EMAIL_SUBJECTS[emailType] || "Authentic Community Notification";
    const html = providedHtml || buildEmailHtml(templateType, emailTemplateData);
    const text = providedText || buildPlainText(templateType, emailTemplateData);

    const result = await sendViaResend(email, subject, html, text);
    console.log("Email sent successfully via Resend", { id: result.id, emailType, email });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Auth email hook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
