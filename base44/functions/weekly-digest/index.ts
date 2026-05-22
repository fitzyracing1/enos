/**
 * Weekly Digest
 * Runs every Monday. Sends all active members + leads a progress update
 * for their area — nudging non-joiners and celebrating progress with members.
 */
import { createClientFromRequest } from "npm:@base44/sdk";

const APP_URL = "https://enos-9bf31738.base44.app";
const FROM_EMAIL = "hello@enos.community";
const FROM_NAME = "Enos Community";

async function sendEmail(to: string, subject: string, html: string, sgKey?: string) {
  if (sgKey) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sgKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    return res.ok;
  }
  console.log(`[WEEKLY DIGEST] Would send to ${to}: ${subject}`);
  return true;
}

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;
  const sgKey = Deno.env.get("SENDGRID_API_KEY");

  try {
    const areas: any[] = await client.entities.Area.list();
    const areaMap = Object.fromEntries(areas.map((a: any) => [a.id, a]));

    // Send to all active members
    const memberships: any[] = await client.entities.Membership.filter({ status: "active" });
    const sentEmails = new Set<string>();
    let totalSent = 0;

    for (const m of memberships) {
      if (!m.email || sentEmails.has(m.email)) continue;
      const area = areaMap[m.area_id];
      if (!area) continue;

      const pct = Math.min(100, ((area.current_members || 0) / (area.target_members || 500)) * 100);
      const needed = Math.max(0, Math.ceil((area.target_members || 500) * 0.6) - (area.current_members || 0));
      const goalReached = pct >= 60 || area.goal_reached;

      const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
<div style="background:white;border-radius:16px;padding:36px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
    <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:9px;display:inline-block;"></div>
    <span style="font-size:20px;font-weight:800;color:#1e1b4b;">Enos Weekly Update</span>
  </div>
  <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">${area.name} — Week ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}</h1>
  ${goalReached
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-size:18px;font-weight:700;color:#15803d;">🎉 Goal Reached! Benefits Unlocked!</p>
        <p style="margin:8px 0 0;color:#16a34a;">Your community has qualified for subsidized home improvements.</p>
       </div>`
    : `<div style="margin:20px 0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#64748b;">
          <span>${area.current_members || 0} members</span><span>Goal: ${Math.ceil((area.target_members||500)*0.6)}</span>
        </div>
        <div style="background:#e2e8f0;border-radius:8px;height:14px;overflow:hidden;">
          <div style="background:#6366f1;width:${pct.toFixed(0)}%;height:100%;border-radius:8px;transition:width 0.5s;"></div>
        </div>
        <p style="margin:10px 0 0;font-size:14px;color:#6366f1;font-weight:600;">${pct.toFixed(0)}% — ${needed} more neighbors needed to unlock benefits</p>
       </div>
       <p style="color:#475569;font-size:15px;line-height:1.6;">Share your referral link to help reach the goal faster:</p>
       <div style="background:#f1f5f9;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#6366f1;margin-bottom:20px;">${APP_URL}?ref=${m.id}</div>`}
  <div style="text-align:center;">
    <a href="${APP_URL}/AreaDetails?id=${area.id}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 32px;border-radius:50px;font-weight:700;font-size:15px;">View Area Progress →</a>
  </div>
</div>
<p style="text-align:center;margin-top:20px;font-size:12px;color:#94a3b8;">
  <a href="${APP_URL}/unsubscribe?email=${encodeURIComponent(m.email)}" style="color:#94a3b8;">Unsubscribe</a>
</p>
</div></body></html>`;

      const sent = await sendEmail(m.email, `Weekly update: ${area.name} is at ${pct.toFixed(0)}%`, html, sgKey);
      if (sent) { sentEmails.add(m.email); totalSent++; }
    }

    // Also send to interested leads (contacted but not joined)
    const leads: any[] = await client.entities.Lead.filter({ status: "contacted" });
    for (const lead of leads) {
      if (!lead.email || sentEmails.has(lead.email)) continue;
      const area = lead.area_id ? areaMap[lead.area_id] : null;
      const pct = area ? Math.min(100, ((area.current_members||0)/(area.target_members||500))*100) : 0;
      const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
<div style="background:white;border-radius:16px;padding:36px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Your neighbors are making progress 🏘️</h1>
  <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
    ${area ? `${area.name} is now at <strong style="color:#6366f1;">${pct.toFixed(0)}%</strong> of the 60% goal.` : "Community areas near you are growing every week."}
    Join for just $1/month — full refund if the goal isn't met.
  </p>
  <div style="text-align:center;">
    <a href="${APP_URL}?ref=${lead.referral_code||lead.id}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;">Join Now — $1/mo →</a>
  </div>
</div>
</div></body></html>`;
      const sent = await sendEmail(lead.email, `${area?.name || "Your area"} update — ${pct.toFixed(0)}% to goal`, html, sgKey);
      if (sent) { sentEmails.add(lead.email); totalSent++; }
    }

    return Response.json({ success: true, emails_sent: totalSent });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
