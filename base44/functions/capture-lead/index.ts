/**
 * Capture Lead
 * Creates a Lead record, matches to the nearest area by city/state,
 * generates a unique referral code, and triggers an immediate pitch email.
 */
import { createClientFromRequest } from "npm:@base44/sdk";

function generateReferralCode(email: string): string {
  const hash = Array.from(email).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffffff, 0);
  return Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
}

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;

  try {
    const body = await req.json();
    const { name, email, city, state, zip_code, referred_by_code, source = "organic" } = body;

    if (!email) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    // Check for existing lead
    const existing = await client.entities.Lead.filter({ email });
    if (existing.length > 0) {
      return Response.json({ success: true, lead_id: existing[0].id, already_exists: true });
    }

    // Find nearest area by city/state
    let area = null;
    let area_id = null;
    let area_name = null;

    if (city || state) {
      const areas = await client.entities.Area.list();
      area = areas.find((a: any) =>
        (city && a.city?.toLowerCase() === city.toLowerCase()) ||
        (state && a.state?.toLowerCase() === state.toLowerCase())
      ) || areas[0]; // fallback to first area

      if (area) {
        area_id = area.id;
        area_name = area.name;
      }
    }

    const referral_code = generateReferralCode(email + Date.now());

    // Award referrer if code provided
    if (referred_by_code) {
      const referrers = await client.entities.Lead.filter({ referral_code: referred_by_code });
      if (referrers.length > 0) {
        const referrer = referrers[0];
        await client.entities.Lead.update(referrer.id, {
          referral_count: (referrer.referral_count || 0) + 1,
        });
      }
    }

    const lead = await client.entities.Lead.create({
      name,
      email,
      city,
      state,
      zip_code,
      area_id,
      area_name,
      status: "new",
      source,
      referral_code,
      referred_by_code,
      referral_count: 0,
      outreach_count: 0,
    });

    return Response.json({
      success: true,
      lead_id: lead.id,
      referral_code,
      area_name,
      message: "Lead captured. You'll receive an email shortly.",
    });
  } catch (err: any) {
    console.error("capture-lead error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
