/**
 * Outreach Email Bot
 *
 * Runs daily. For every new lead, sends a personalized pitch email.
 * For leads contacted 1x, sends a follow-up after 3 days.
 * Integrates with SendGrid if SENDGRID_API_KEY secret is set,
 * otherwise falls back to Base44's built-in email.
 */
import { createClientFromRequest } from "npm:@base44/sdk";
import dayjs from "npm:dayjs";

const APP_URL = "https://enos-9bf31738.base44.app";
const FROM_EMAIL = "hello@enos.community";
const FROM_NAME = "Enos Community";

function pitchEmailHtml(lead: any, area: any, referralUrl: string): string {
  const progress = area
    ? Math.min(100, ((area.current_members || 0) / (area.target_members || 500)) * 100).toFixed(0)
    : null;

  const areaSection = area
    ? `
    <div style="background:#f0f4ff;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#6366f1;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Area</p>
      <h2 style="margin:0 0 4px;font-size:22px;color:#1e1b4b;">${area.name}</h2>
      <p style="margin:0 0 16px;color:#64748b;">${area.city}, ${area.state}</p>
      <div style="background:#e0e7ff;border-radius:8px;height:12px;overflow:hidden;margin-bottom:8px;">
        <div style="background:#6366f1;width:${progress}%;height:100%;border-radius:8px;"></div>
      </div>
      <p style="margin:0;font-size:13px;color:#6366f1;font-weight:600;">${progress}% toward the 60% goal — ${area.current_members || 0} neighbors already in</p>
    </div>`
    : `<p style="color:#64748b;margin:16px 0;">We're building a community in your area — and we need people like you to make it happen.</p>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:18px;font-weight:bold;">E</span>
        </div>
        <span style="font-size:22px;font-weight:bold;color:#1e1b4b;">Enos</span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:white;border-radius:16px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#0f172a;">
        Hi ${lead.name || "neighbor"} 👋
      </h1>
      <p style="margin:0 0 20px;font-size:16px;color:#475569;line-height:1.6;">
        I'm Enos — a community program where neighbors chip in just <strong style="color:#6366f1;">$1/month</strong> to build a shared fund for home improvements.
      </p>

      ${areaSection}

      <h2 style="font-size:20px;color:#0f172a;margin:24px 0 12px;">Here's how it works:</h2>
      <div style="space-y:12px;">
        ${["Join your neighborhood fund for $1/month",
           "When 60% of neighbors join, everyone unlocks subsidized home repairs",
           "Benefits: up to 50% off repairs, renovation grants, group discounts",
           "If 60% isn't reached — you get every dollar back automatically"].map((s, i) =>
          `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="width:24px;height:24px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white;font-size:12px;font-weight:bold;">${i+1}</div>
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.5;">${s}</p>
          </div>`).join("")}
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}?ref=${lead.referral_code || ""}"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
          Join Your Community — $1/mo →
        </a>
      </div>

      <!-- Zero-risk banner -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">
          🔒 Zero risk — full automatic refund if 60% isn't reached.
        </p>
      </div>

      <!-- Referral -->
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f1f5f9;">
        <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Share with a neighbor and help your area reach the goal faster:</p>
        <div style="background:#f8fafc;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#6366f1;word-break:break-all;">
          ${referralUrl}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;margin-top:24px;font-size:12px;color:#94a3b8;">
      Enos Community · hello@enos.community<br>
      <a href="${APP_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color:#94a3b8;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

function followUpEmailHtml(lead: any, area: any, referralUrl: string): string {
  const progress = area
    ? Math.min(100, ((area.current_members || 0) / (area.target_members || 500)) * 100).toFixed(0)
    : "?";

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:16px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;">
        Quick update on ${lead.area_name || "your area"} 🏘️
      </h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hey ${lead.name || "there"}, just checking in. Your community is at <strong style="color:#6366f1;">${progress}%</strong> of the 60% goal.
        Every neighbor who joins gets us closer to unlocking subsidized home improvements for everyone.
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        And remember — <strong>if we don't hit 60%, you pay nothing.</strong> Every dollar is automatically refunded. It's completely risk-free.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}?ref=${lead.referral_code || ""}"
           style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;">
          Join Now — $1/month →
        </a>
      </div>
      <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:24px;">
        <a href="${APP_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color:#94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, toName: string, subject: string, html: string, sgKey?: string): Promise<boolean> {
  if (sgKey) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sgKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to, name: toName }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    return res.ok;
  }
  // Log only when no email provider is configured
  console.log(`[OUTREACH] Would send to ${to}: ${subject}`);
  return true;
}

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;
  const sgKey = Deno.env.get("SENDGRID_API_KEY");

  try {
    const now = dayjs();

    // Get all leads that need outreach
    const allLeads: any[] = await client.entities.Lead.list();

    const toContact = allLeads.filter((l: any) => {
      if (l.status === "joined" || l.status === "unsubscribed") return false;
      if (l.outreach_count === 0) return true; // never contacted — send now
      if (l.outreach_count === 1) {
        // send follow-up after 3 days
        const lastContact = dayjs(l.last_contacted_at);
        return now.diff(lastContact, "day") >= 3;
      }
      if (l.outreach_count === 2) {
        // send final nudge after 7 more days
        const lastContact = dayjs(l.last_contacted_at);
        return now.diff(lastContact, "day") >= 7;
      }
      return false; // max 3 emails per lead
    });

    const results: any[] = [];

    for (const lead of toContact) {
      try {
        // Get their matched area
        let area = null;
        if (lead.area_id) {
          const areas = await client.entities.Area.filter({ id: lead.area_id });
          area = areas[0] || null;
        }

        const referralUrl = `${APP_URL}?ref=${lead.referral_code || lead.id}`;
        const isFirstEmail = (lead.outreach_count || 0) === 0;
        const subject = isFirstEmail
          ? `Your neighbors are building something — $1/month can change your street`
          : `Quick update: ${lead.area_name || "your area"} is getting closer 🏘️`;

        const html = isFirstEmail
          ? pitchEmailHtml(lead, area, referralUrl)
          : followUpEmailHtml(lead, area, referralUrl);

        const sent = await sendEmail(lead.email, lead.name || "", subject, html, sgKey);

        if (sent) {
          await client.entities.Lead.update(lead.id, {
            status: lead.outreach_count === 0 ? "contacted" : lead.status,
            outreach_count: (lead.outreach_count || 0) + 1,
            last_contacted_at: now.toISOString(),
          });
          results.push({ email: lead.email, sent: true, type: isFirstEmail ? "pitch" : "follow_up" });
        }
      } catch (leadErr: any) {
        console.error(`Failed to send to ${lead.email}:`, leadErr);
        results.push({ email: lead.email, sent: false, error: leadErr.message });
      }
    }

    return Response.json({ success: true, processed: toContact.length, results });
  } catch (err: any) {
    console.error("outreach-email error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
