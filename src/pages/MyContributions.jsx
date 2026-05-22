import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DollarSign, Users, CreditCard, CheckCircle, XCircle, PauseCircle, ArrowRight, Shield, LogIn
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const STATUS_STYLES = {
  active: { icon: CheckCircle, color: "bg-emerald-100 text-emerald-700", label: "Active" },
  paused: { icon: PauseCircle, color: "bg-amber-100 text-amber-700", label: "Paused" },
  cancelled: { icon: XCircle, color: "bg-gray-100 text-gray-700", label: "Cancelled" },
  refunded: { icon: DollarSign, color: "bg-blue-100 text-blue-700", label: "Refunded" },
};

const CONTRIB_STATUS = {
  in_escrow: { label: "In Escrow", color: "bg-indigo-100 text-indigo-700" },
  released: { label: "Released", color: "bg-emerald-100 text-emerald-700" },
  refunded: { label: "Refunded", color: "bg-blue-100 text-blue-700" },
  pending: { label: "Pending", color: "bg-gray-100 text-gray-600" },
};

export default function MyContributions() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: memberships = [], isLoading: memLoading } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.Membership.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: contributions = [], isLoading: contribLoading } = useQuery({
    queryKey: ["myContributions", user?.email],
    queryFn: () => base44.entities.Contribution.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: () => base44.entities.Area.list(),
  });

  if (!user && !userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to view your contributions</h2>
          <p className="text-gray-600 mb-6">Track your impact and manage your community memberships.</p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
          >
            Sign In
          </button>
        </Card>
      </div>
    );
  }

  const isLoading = userLoading || memLoading || contribLoading;
  const totalContributed = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const activeMemberships = memberships.filter((m) => m.status === "active").length;

  const getAreaProgress = (areaId) => {
    const area = areas.find((a) => a.id === areaId);
    if (!area || !area.target_members) return 0;
    return Math.min(100, (area.current_members / area.target_members) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Contributions</h1>
          <p className="text-gray-600 text-lg">Track your community impact and escrow status</p>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: DollarSign, value: `$${totalContributed.toFixed(2)}`, label: "Total Contributed", color: "bg-emerald-500" },
            { icon: Users, value: activeMemberships, label: "Active Communities", color: "bg-indigo-500" },
            { icon: CreditCard, value: contributions.length, label: "Payments Made", color: "bg-purple-500" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-6">
                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Escrow info */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-6 mb-12 flex items-start gap-4">
          <Shield className="w-8 h-8 text-white/80 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Your Escrow Protection</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              All your payments are held securely in escrow. If any community doesn't reach 60% of its member goal before the deadline, your contributions to that area are <strong className="text-white">automatically and fully refunded</strong>.
            </p>
          </div>
        </div>

        {/* Memberships */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Communities</h2>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : memberships.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">No memberships yet</h3>
              <p className="text-gray-400 mb-6">Join a community area to start contributing.</p>
              <Link to="/">
                <button className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">
                  Explore Areas
                </button>
              </Link>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {memberships.map((m, i) => {
                const status = STATUS_STYLES[m.status] || STATUS_STYLES.active;
                const progress = getAreaProgress(m.area_id);
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{m.area_name}</h3>
                          <p className="text-gray-500 text-sm">${m.monthly_amount}/month · {m.subscription_type}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                          <status.icon className="w-3 h-3" /> {status.label}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>Community progress</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-gray-500">
                          Total contributed: <strong className="text-gray-900">${(m.total_contributed || 0).toFixed(2)}</strong>
                        </p>
                        <Link to={`/AreaDetails?id=${m.area_id}`} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contribution history */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>
          {contributions.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payments yet.</p>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-gray-100">
                {contributions.map((c, i) => {
                  const st = CONTRIB_STATUS[c.status] || CONTRIB_STATUS.pending;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{c.area_name}</p>
                        <p className="text-gray-500 text-sm">{c.month}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                        <span className="font-bold text-gray-900">${c.amount}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
