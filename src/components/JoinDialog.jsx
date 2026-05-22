import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, CreditCard, CheckCircle, Shield, ArrowRight, Loader2 } from "lucide-react";
import dayjs from "dayjs";

export default function JoinDialog({ open, onClose, area, onSuccess }) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const amount = plan === "premium" ? 9 : 1;

  const handleJoin = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const Month = dayjs().format("YYYY-MM");
      const today = dayjs().format("YYYY-MM-DD");
      const targetMembers = area.target_members || 500;

      // Create membership
      await base44.entities.Membership.create({
        area_id: area.id,
        area_name: area.name,
        subscription_type: plan,
        monthly_amount: amount,
        status: "active",
        joined_date: today,
        total_contributed: amount,
        email: user.email,
        name: user.full_name || user.email,
      });

      // Record contribution in escrow
      await base44.entities.Contribution.create({
        area_id: area.id,
        area_name: area.name,
        amount,
        month: Month,
        status: "in_escrow",
      });

      // Update area stats
      const newCount = (area.current_members || 0) + 1;
      const pct = (newCount / targetMembers) * 100;
      const goalReached = pct >= 60;

      await base44.entities.Area.update(area.id, {
        current_members: newCount,
        monthly_pool: (area.monthly_pool || 0) + amount,
        total_collected: (area.total_collected || 0) + amount,
        escrow_amount: (area.escrow_amount || 0) + amount,
        goal_reached: goalReached,
        goal_reached_date: goalReached && !area.goal_reached ? today : area.goal_reached_date,
        status: goalReached ? "goal_reached" : "active",
        deadline: area.deadline || dayjs().add(12, "month").format("YYYY-MM-DD"),
      });

      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPlan("monthly");
    setDone(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">You're In! 🎉</h3>
            <p className="text-gray-600 mb-2">
              Welcome to <strong>{area?.name}</strong>. Your $<strong>{amount}</strong> has been placed in escrow.
            </p>
            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700 mt-4">
              <Shield className="w-4 h-4 inline mr-1" />
              <strong>Zero-risk guarantee:</strong> If your area doesn't reach 60% of members, you get every dollar back — automatically.
            </div>
            <button
              onClick={handleClose}
              className="mt-6 w-full py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
            >
              Awesome, thanks!
            </button>
          </div>
        ) : step === 1 ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <DialogTitle>Join {area?.name}</DialogTitle>
              </div>
              <DialogDescription>
                Choose your monthly contribution. All funds are held in escrow until the 60% goal is reached.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              {[
                {
                  id: "monthly",
                  label: "$1 / month",
                  desc: "Community standard rate",
                  badge: "Most popular",
                  badgeColor: "bg-indigo-100 text-indigo-700",
                },
                {
                  id: "premium",
                  label: "$9 / month",
                  desc: "Champion supporter",
                  badge: "Priority benefits",
                  badgeColor: "bg-purple-100 text-purple-700",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPlan(opt.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                    plan === opt.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-100 hover:border-gray-200 bg-gray-50"
                  }`}
                >
                  <div>
                    <p className={`font-bold text-lg ${plan === opt.id ? "text-indigo-700" : "text-gray-800"}`}>
                      {opt.label}
                    </p>
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Escrow info */}
            <div className="bg-emerald-50 rounded-xl p-3 mt-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-700">
                <strong>Zero-risk:</strong> Payments go into escrow. Full automatic refund if 60% goal isn't reached.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleClose} className="flex-1 py-3 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <DialogTitle>Confirm & Join</DialogTitle>
              </div>
              <DialogDescription>
                Review your commitment before joining {area?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-gray-50 rounded-2xl p-5 mt-2 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Community</span>
                <span className="font-semibold text-gray-900">{area?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-gray-900">{plan === "premium" ? "Champion ($9/mo)" : "Standard ($1/mo)"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Monthly amount</span>
                <span className="font-bold text-indigo-700 text-base">${amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="font-semibold text-gray-900">Held in escrow</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="text-gray-500">Refund if goal missed</span>
                <span className="font-semibold text-emerald-600">100% automatic</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl mt-2">{error}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                Back
              </button>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Joining..." : `Join — $${amount}/mo`}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              By joining you agree to monthly contributions held securely in escrow.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
