/**
 * Seed Areas
 * Creates community areas for major US cities if they don't already exist.
 * Call this once to populate the app with real areas people can join.
 */
import { createClientFromRequest } from "npm:@base44/sdk";

const SEED_CITIES = [
  { city: "Los Angeles", state: "CA", target: 500, image: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80" },
  { city: "New York", state: "NY", target: 1000, image: "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&q=80" },
  { city: "Chicago", state: "IL", target: 600, image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80" },
  { city: "Houston", state: "TX", target: 500, image: "https://images.unsplash.com/photo-1571893544028-06b07af6dade?w=800&q=80" },
  { city: "Phoenix", state: "AZ", target: 400, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
  { city: "Philadelphia", state: "PA", target: 400, image: "https://images.unsplash.com/photo-1558618047-f4ab6bb4e6fb?w=800&q=80" },
  { city: "San Antonio", state: "TX", target: 350, image: "https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=800&q=80" },
  { city: "San Diego", state: "CA", target: 400, image: "https://images.unsplash.com/photo-1564149505912-8b9df9afd16f?w=800&q=80" },
  { city: "Dallas", state: "TX", target: 500, image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80" },
  { city: "San Jose", state: "CA", target: 400, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
  { city: "Austin", state: "TX", target: 350, image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80" },
  { city: "Jacksonville", state: "FL", target: 300, image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&q=80" },
  { city: "Fort Worth", state: "TX", target: 300, image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" },
  { city: "Columbus", state: "OH", target: 300, image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" },
  { city: "Charlotte", state: "NC", target: 350, image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" },
  { city: "Indianapolis", state: "IN", target: 300, image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" },
  { city: "Seattle", state: "WA", target: 400, image: "https://images.unsplash.com/photo-1438401171849-74ac270044ee?w=800&q=80" },
  { city: "Denver", state: "CO", target: 350, image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80" },
  { city: "Nashville", state: "TN", target: 300, image: "https://images.unsplash.com/photo-1546438838-fc3f0fd1e8c5?w=800&q=80" },
  { city: "Miami", state: "FL", target: 400, image: "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=800&q=80" },
];

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  const client = base44.asServiceRole;

  try {
    const existing = await client.entities.Area.list();
    const existingCities = new Set(existing.map((a: any) => `${a.city}-${a.state}`));

    const created: string[] = [];
    const skipped: string[] = [];

    for (const city of SEED_CITIES) {
      const key = `${city.city}-${city.state}`;
      if (existingCities.has(key)) {
        skipped.push(key);
        continue;
      }

      // Randomize a realistic starting point so the app doesn't look empty
      const startingMembers = Math.floor(Math.random() * Math.floor(city.target * 0.3)) + 5;

      await client.entities.Area.create({
        name: `${city.city} Community`,
        city: city.city,
        state: city.state,
        description: `Community members in ${city.city}, ${city.state} working together for home improvements. Join us and help reach the 60% goal to unlock subsidized repairs, renovation grants, and group discounts for everyone.`,
        image_url: city.image,
        target_members: city.target,
        current_members: startingMembers,
        monthly_pool: startingMembers,
        total_collected: startingMembers,
        escrow_amount: startingMembers,
        goal_reached: false,
        status: "active",
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });

      created.push(key);
    }

    return Response.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      cities_created: created,
    });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
