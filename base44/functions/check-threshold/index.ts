import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;

  try {
    const today = new Date().toISOString().split("T")[0];

    // Get all active areas
    const areas = await client.entities.Area.list();
    const activeAreas = areas.filter((a: any) => a.status === "active");

    const results = [];

    for (const area of activeAreas) {
      const targetMembers = area.target_members || 500;
      const currentMembers = area.current_members || 0;
      const progressPct = (currentMembers / targetMembers) * 100;

      // Check if 60% goal reached
      if (progressPct >= 60 && !area.goal_reached) {
        await client.entities.Area.update(area.id, {
          goal_reached: true,
          goal_reached_date: today,
          status: "goal_reached",
        });

        // Release all in-escrow contributions for this area
        const contribs = await client.entities.Contribution.filter({
          area_id: area.id,
          status: "in_escrow",
        });

        for (const c of contribs) {
          await client.entities.Contribution.update(c.id, {
            status: "released",
            released_at: new Date().toISOString(),
          });
        }

        results.push({
          area: area.name,
          action: "goal_reached",
          members: currentMembers,
          progress: progressPct.toFixed(1),
        });
        continue;
      }

      // Check if deadline passed and goal not reached
      if (area.deadline && area.deadline < today && !area.goal_reached) {
        await client.entities.Area.update(area.id, { status: "refunding" });

        // Trigger refunds for all in-escrow contributions
        const refundResponse = await fetch(
          `${req.url.replace("check-threshold", "issue-refunds")}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: req.headers.get("Authorization") || "" },
            body: JSON.stringify({ area_id: area.id }),
          }
        );

        results.push({
          area: area.name,
          action: "refunding",
          deadline: area.deadline,
          members: currentMembers,
          progress: progressPct.toFixed(1),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("check-threshold error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
