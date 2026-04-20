import { Resend } from "resend";
import { marked } from "marked";

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

export async function sendDigestEmail({
  to,
  workspaceName,
  weekOf,
  summaryMarkdown,
}: {
  to: string[];
  workspaceName: string;
  weekOf: string;
  summaryMarkdown: string;
}): Promise<{ id: string | null }> {
  if (to.length === 0) return { id: null };

  const from = process.env.DIGEST_FROM_EMAIL || "onboarding@resend.dev";
  const subject = `${workspaceName} - Week of ${weekOf}`;
  const body = await marked.parse(summaryMarkdown);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; line-height: 1.55; color: #111;">
      <h2 style="margin: 0 0 6px; font-size: 18px; letter-spacing: -0.01em;">${workspaceName}</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 13px;">Week of ${weekOf}</p>
      <div style="font-size: 15px;">${body}</div>
      <hr style="margin: 40px 0 12px; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">radarmemo</p>
    </div>
  `;

  const resend = getClient();
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) throw new Error(`Resend failed: ${error.message}`);
  return { id: data?.id ?? null };
}
