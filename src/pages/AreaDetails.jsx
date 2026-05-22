import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Users, DollarSign, ChevronLeft, CheckCircle, Shield, Wrench, Home, Gift, MapPin, Calendar, AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import JoinDialog from "@/components/JoinDialog";
import dayjs from "dayjs";

const BENEFITS = [
  { icon: Wrench, title: "Subsidized Repairs", desc: "Up to 50% off home repairs" },
  { icon: Home, title: "Renovation Grants", desc: "Community improvement funds" },
  { icon: Gift, title: "Group Discounts", desc: "Bulk pricing on materials" },
  { icon: Users, title: "Priority Service", desc: "First access to contractors" },
];

export default function AreaDetails() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const areaId = new URLSearchParams(location.search).get("id");
  const [joinOpen, setJoinOpen] = useState(false);

  const { data: area, isLoading } = useQuery({
    queryKey: ["area", areaId],
    queryFn: async () => {
      const results = await base44.entities.Area.filter({ id: areaId });
      return results[0] || null;
    },
    enabled: !!areaId,
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", areaId, user?.email],
    queryFn: async () => {
      const results = await base44.entities.Membership.filter({ area_id: areaId, created_by: user.email });
      return results[0] || null;
    },
    enabled: !!areaId && !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 rounded-xl w-2/3 animate-pulse" />
              <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            </div>
            <div className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Area not found</h2>
          <Link to="/" className="text-indigo-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const targetMembers = area.target_members || 500;
  const currentMembers = area.current_members || 0;
  const pct = Math.min(100, (currentMembers / targetMembers) * 100);
  const goalReached = pct >= 60 || area.goal_reached;
  const isMember = !!membership;

  const daysLeft = area.deadline
    ? Math.max(0, dayjs(area.deadline).diff(dayjs(), "day"))
    : null;

  return (
    <>
      {/* Hero image */}
      <div className="relative h-80 lg:h-96 mt-20">
        <img
          src={area.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80"}
          alt={area.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="absolute top-6 left-6">
          <Link to="/">
            <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </Link>
        </div>

        <div className="absolute bottom-8 left-6 right-6">
          <div className="max-w-6xl mx-auto">
            {goalReached && (
              <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-medium mb-3">
                <CheckCircle className="w-3.5 h-3.5" /> Goal Reached — Benefits Unlocked!
              </div>
            )}
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">{area.name}</h1>
            <div className="flex items-center text-white/80 gap-1">
              <MapPin className="w-4 h-4" /> {area.city}, {area.state}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, value: currentMembers.toLocaleString(), label: "Members" },
                { icon: DollarSign, value: `$${(area.total_collected || 0).toLocaleString()}`, label: "Total Raised" },
                { icon: DollarSign, value: `$${(area.monthly_pool || 0).toLocaleString()}`, label: "Monthly Pool" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="p-5">
                    <s.icon className="w-5 h-5 text-indigo-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-sm text-gray-500">{s.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Progress */}
            <Card className="p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Community Progress</h2>
                <Badge variant={goalReached ? "success" : "default"}>
                  {pct.toFixed(0)}% of goal
                </Badge>
              </div>
              <Progress value={pct} className="h-4 mb-3" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{currentMembers} members joined</span>
                <span>Target: {targetMembers}</span>
              </div>
              {!goalReached && daysLeft !== null && (
                <div className={`mt-4 flex items-center gap-2 text-sm ${daysLeft < 30 ? "text-amber-600" : "text-gray-500"}`}>
                  <Calendar className="w-4 h-4" />
                  {daysLeft > 0 ? `${daysLeft} days left to reach goal` : "Deadline passed — processing refunds"}
                </div>
              )}
              {!goalReached && (
                <div className="mt-4 bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-indigo-700">
                    <strong>{Math.ceil(targetMembers * 0.6 - currentMembers)}</strong> more members needed to unlock benefits.
                    If 60% isn't reached, all contributions are fully refunded automatically.
                  </p>
                </div>
              )}
            </Card>

            {/* Description */}
            {area.description && (
              <Card className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About This Area</h2>
                <p className="text-gray-600 leading-relaxed">{area.description}</p>
              </Card>
            )}

            {/* Benefits */}
            <Card className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {goalReached ? "🎉 Unlocked Benefits" : "Benefits at 60% Goal"}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {BENEFITS.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className={`flex items-start gap-4 p-4 rounded-2xl ${goalReached ? "bg-emerald-50" : "bg-gray-50"}`}
                  >
                    <div className={`p-3 rounded-xl flex-shrink-0 ${goalReached ? "bg-emerald-500" : "bg-indigo-600"}`}>
                      <b.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{b.title}</p>
                      <p className="text-gray-500 text-sm">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right sidebar — join card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <Card className="p-6 shadow-xl">
                {isMember ? (
                  <div className="text-center">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">You're a Member!</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Contributing ${membership.monthly_amount}/mo · {membership.subscription_type} plan
                    </p>
                    <Badge variant="success" className="text-sm px-4 py-1.5">
                      Active Membership
                    </Badge>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Join This Community</h3>
                    <p className="text-gray-500 text-sm mb-6">Start contributing and build toward better neighborhoods.</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Standard plan</span>
                        <span className="font-bold text-gray-900">$1 / month</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Champion plan</span>
                        <span className="font-bold text-gray-900">$9 / month</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          base44.auth.redirectToLogin(window.location.href);
                          return;
                        }
                        setJoinOpen(true);
                      }}
                      className={`w-full py-3.5 rounded-full font-bold text-white transition-colors ${
                        goalReached ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {goalReached ? "Join & Access Benefits" : "Join Community — from $1/mo"}
                    </button>

                    <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
                      <Shield className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Funds held in escrow. Full auto-refund if 60% goal isn't reached by the deadline.</span>
                    </div>

                    {area.status === "refunded" && (
                      <div className="mt-4 flex items-center gap-2 bg-amber-50 text-amber-700 text-sm p-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        This area's goal was not met. All contributions have been refunded.
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      <JoinDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        area={area}
        onSuccess={() => {
          queryClient.invalidateQueries(["area", areaId]);
          queryClient.invalidateQueries(["membership", areaId]);
          setJoinOpen(false);
        }}
      />
    </>
  );
}
