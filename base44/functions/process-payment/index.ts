import { createClientFromRequest } from "npm:@base44/sdk";
import Stripe from "npm:stripe";
import dayjs from "npm:dayjs";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;

  try {
    const body = await req.json();
    const {
      area_id,
      subscription_type = "monthly",
      payment_method_id,
      email,
      name: memberName,
    } = body;

    if (!area_id) {
      return new Response(
        JSON.stringify({ error: "area_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const monthlyAmount = subscription_type === "premium" ? 9 : 1;
    const today = dayjs().format("YYYY-MM-DD");
    const currentMonth = dayjs().format("YYYY-MM");

    // Calculate deadline: 12 months from area creation (or from now if not set)
    const areas = await client.entities.Area.filter({ id: area_id });
    const area = areas[0];

    if (!area) {
      return new Response(
        JSON.stringify({ error: "Area not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    let stripeCustomerId: string | undefined;
    let paymentIntentId: string | undefined;

    if (stripeKey && payment_method_id) {
      const stripe = new Stripe(stripeKey);

      // Create or retrieve Stripe customer
      const customers = await stripe.customers.list({ email, limit: 1 });
      let customer = customers.data[0];

      if (!customer) {
        customer = await stripe.customers.create({
          email,
          name: memberName,
          payment_method: payment_method_id,
          invoice_settings: { default_payment_method: payment_method_id },
        });
      }

      stripeCustomerId = customer.id;

      // Create payment intent (captures immediately, held in Enos escrow ledger)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: monthlyAmount * 100, // cents
        currency: "usd",
        customer: customer.id,
        payment_method: payment_method_id,
        confirm: true,
        description: `Enos community contribution — ${area.name} — ${currentMonth}`,
        metadata: {
          area_id,
          area_name: area.name,
          subscription_type,
          month: currentMonth,
        },
      });

      paymentIntentId = paymentIntent.id;
    }

    // Create membership record
    const membership = await client.entities.Membership.create({
      area_id,
      area_name: area.name,
      subscription_type,
      monthly_amount: monthlyAmount,
      status: "active",
      joined_date: today,
      total_contributed: monthlyAmount,
      stripe_customer_id: stripeCustomerId,
      email,
      name: memberName,
    });

    // Create contribution record (in escrow)
    await client.entities.Contribution.create({
      area_id,
      area_name: area.name,
      membership_id: membership.id,
      amount: monthlyAmount,
      month: currentMonth,
      status: "in_escrow",
      stripe_payment_intent_id: paymentIntentId,
    });

    // Update area stats
    const newMemberCount = (area.current_members || 0) + 1;
    const newMonthlyPool = (area.monthly_pool || 0) + monthlyAmount;
    const newEscrow = (area.escrow_amount || 0) + monthlyAmount;
    const newTotal = (area.total_collected || 0) + monthlyAmount;
    const progressPct = (newMemberCount / (area.target_members || 500)) * 100;
    const goalReached = progressPct >= 60;

    await client.entities.Area.update(area_id, {
      current_members: newMemberCount,
      monthly_pool: newMonthlyPool,
      escrow_amount: newEscrow,
      total_collected: newTotal,
      goal_reached: goalReached,
      goal_reached_date: goalReached && !area.goal_reached ? today : area.goal_reached_date,
      status: goalReached ? "goal_reached" : "active",
      // Set deadline to 12 months out if not already set
      deadline: area.deadline || dayjs().add(12, "month").format("YYYY-MM-DD"),
    });

    return new Response(
      JSON.stringify({
        success: true,
        membership_id: membership.id,
        area_name: area.name,
        goal_reached: goalReached,
        progress_pct: progressPct.toFixed(1),
        monthly_amount: monthlyAmount,
        escrow_message: goalReached
          ? "Goal reached! Funds will be released for home improvements."
          : "Your payment is safely held in escrow. If the 60% goal is not reached, you get a full refund.",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("process-payment error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
