import { createClientFromRequest } from "npm:@base44/sdk";
import Stripe from "npm:stripe";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;

  try {
    const body = await req.json();
    const { area_id } = body;

    if (!area_id) {
      return new Response(
        JSON.stringify({ error: "area_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey) : null;

    // Get all in-escrow contributions for this area
    const contributions = await client.entities.Contribution.filter({
      area_id,
      status: "in_escrow",
    });

    const refundResults = [];
    let totalRefunded = 0;

    for (const contrib of contributions) {
      try {
        // Issue Stripe refund if payment intent exists and Stripe is configured
        if (stripe && contrib.stripe_payment_intent_id) {
          await stripe.refunds.create({
            payment_intent: contrib.stripe_payment_intent_id,
            reason: "fraudulent", // use 'requested_by_customer' for real use
          });
        }

        // Mark contribution as refunded
        await client.entities.Contribution.update(contrib.id, {
          status: "refunded",
          refunded_at: new Date().toISOString(),
        });

        totalRefunded += contrib.amount || 0;
        refundResults.push({ id: contrib.id, amount: contrib.amount, status: "refunded" });
      } catch (refundErr: any) {
        console.error(`Failed to refund contribution ${contrib.id}:`, refundErr);
        refundResults.push({ id: contrib.id, status: "failed", error: refundErr.message });
      }
    }

    // Update memberships to refunded status
    const memberships = await client.entities.Membership.filter({
      area_id,
      status: "active",
    });

    for (const membership of memberships) {
      await client.entities.Membership.update(membership.id, {
        status: "refunded",
      });
    }

    // Mark area as fully refunded
    await client.entities.Area.update(area_id, {
      status: "refunded",
      escrow_amount: 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        area_id,
        total_refunded: totalRefunded,
        contributions_refunded: refundResults.filter((r) => r.status === "refunded").length,
        results: refundResults,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("issue-refunds error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
