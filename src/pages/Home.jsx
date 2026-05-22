import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  Users, DollarSign, Wrench, Gift, Shield, Search, TrendingUp, Home as HomeIcon, MapPin, ChevronRight
} from "lucide-react";
import AreaCard from "@/components/AreaCard";
import SalesChatBot from "@/components/SalesChatBot";

const HOW_IT_WORKS = [
  {
    icon: MapPin,
    title: "Join Your Area",
    description: "Find your neighborhood and become a contributing member with just one click.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: DollarSign,
    title: "Contribute $1/Month",
    description: "Pay just $1 per month. Funds are pooled together for your entire community — held in escrow.",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: TrendingUp,
    title: "Reach 60% Goal",
    description: "When 60% of target members join, your community unlocks the full benefit package.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Wrench,
    title: "Get Subsidized Improvements",
    description: "Access subsidized home improvement services for everyone in your area.",
    color: "from-emerald-500 to-teal-600",
  },
];

const BENEFITS = [
  { icon: Wrench, title: "Subsidized Repairs", desc: "Up to 50% off home repairs" },
  { icon: HomeIcon, title: "Renovation Grants", desc: "Community improvement funds" },
  { icon: Gift, title: "Group Discounts", desc: "Bulk pricing on materials" },
  { icon: Users, title: "Priority Service", desc: "First access to contractors" },
];

export default function Home() {
  const areasRef = useRef(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: () => base44.entities.Area.list("-current_members", 50),
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.Membership.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const memberAreaIds = new Set(memberships.map((m) => m.area_id));

  const filtered = areas.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.state?.toLowerCase().includes(q)
    );
  });

  const scrollToAreas = () => areasRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 min-h-[90vh] flex items-center">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 lg:py-40 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/80">Community-powered home improvement</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Build better{" "}
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                neighborhoods
              </span>
            </h1>

            <p className="text-xl text-white/70 leading-relaxed mb-10 max-w-lg">
              Just <strong className="text-white">$1 a month</strong>. When your community reaches{" "}
              <strong className="text-white">60% participation</strong>, everyone unlocks subsidized home
              improvements. Zero risk — full refund if the goal isn't met.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToAreas}
                className="flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-white/90 text-lg px-8 py-4 rounded-full font-bold shadow-2xl transition-colors"
              >
                Find Your Area <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-6 py-4 rounded-full">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-white/90 font-medium">100% Refund Guarantee</span>
              </div>
            </div>
          </motion.div>

          {/* Right — stats card */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
              <h3 className="text-white font-bold text-xl mb-6">How your $1 works</h3>
              <div className="space-y-4">
                {[
                  { label: "Your monthly contribution", value: "$1", color: "text-emerald-400" },
                  { label: "Held in escrow (zero risk)", value: "✓ Safe", color: "text-white" },
                  { label: "Goal: 60% of neighbors", value: "60%", color: "text-indigo-300" },
                  { label: "Your savings on repairs", value: "Up to 50%", color: "text-yellow-300" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                    <span className="text-white/70 text-sm">{item.label}</span>
                    <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4">
                <p className="text-emerald-300 text-sm font-medium">
                  🔒 If 60% is not reached — every cent is automatically refunded. No questions asked.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">How Enos Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple, transparent process that brings communities together
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" />
                )}
                <div className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits preview */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Unlocked at 60%</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">Real Benefits for Real Homeowners</h2>
              <p className="text-gray-600 text-lg mb-8">
                When your neighborhood reaches 60% participation, these services unlock for everyone — members and non-members alike.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
                      <p className="text-gray-500 text-xs">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white">
                <Shield className="w-10 h-10 text-white/80 mb-4" />
                <h3 className="text-2xl font-bold mb-3">Zero-Risk Guarantee</h3>
                <p className="text-white/80 leading-relaxed mb-6">
                  Your money is held in escrow until the 60% goal is reached. If the deadline passes without reaching the goal, every member receives a full automatic refund.
                </p>
                <div className="space-y-3">
                  {[
                    "✓  Funds held in secure escrow",
                    "✓  No hidden fees",
                    "✓  Cancel anytime before goal",
                    "✓  100% auto-refund if goal missed",
                  ].map((item, i) => (
                    <p key={i} className="text-white/90 text-sm">{item}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Explore Areas */}
      <section ref={areasRef} className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-3">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">Growing Communities</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Explore Areas</h2>
            </div>
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="Search by city or state…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 h-14 text-lg rounded-full border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none px-4 bg-white"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-gray-200 h-80 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No areas found</h3>
              <p className="text-gray-400">Try a different search or be the first to start one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((area) => (
                <AreaCard
                  key={area.id}
                  area={area}
                  isMember={memberAreaIds.has(area.id)}
                  onJoined={() => queryClient.invalidateQueries(["areas"])}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sales bot */}
      <SalesChatBot />
    </>
  );
}
