import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, MapPin, CheckCircle, Loader2, Share2, Copy } from "lucide-react";

export default function LeadCaptureForm() {
  const [step, setStep] = useState("form"); // form | success
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [areaName, setAreaName] = useState("");
  const [form, setForm] = useState({ name: "", email: "", city: "", state: "" });

  const refUrl = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : "";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email) return;
    setLoading(true);
    try {
      // Get referral code from URL if any
      const urlRef = new URLSearchParams(window.location.search).get("ref");
      const result = await base44.functions.invoke("capture-lead", {
        name: form.name,
        email: form.email,
        city: form.city,
        state: form.state.toUpperCase(),
        referred_by_code: urlRef || undefined,
        source: urlRef ? "referral" : "organic",
      });
      setReferralCode(result.referral_code || "");
      setAreaName(result.area_name || "your area");
      setStep("success");
    } catch {
      // Fallback: store via entity directly
      try {
        await base44.entities.Lead.create({
          name: form.name,
          email: form.email,
          city: form.city,
          state: form.state.toUpperCase(),
          status: "new",
          source: "organic",
        });
        setAreaName(form.city ? `${form.city} Community` : "your area");
        setStep("success");
      } catch {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(refUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Enos — $1/month community home improvement",
        text: "I just joined Enos! We pool $1/month and when 60% of neighbors join, everyone gets subsidized home improvements. Zero risk — full refund if goal isn't met.",
        url: refUrl,
      });
    } else {
      copyLink();
    }
  };

  if (step === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You're on the list! 🎉</h3>
        <p className="text-gray-500 mb-6">
          We'll keep you posted on <strong className="text-gray-700">{areaName}</strong>'s progress and let you know when it's time to join.
        </p>

        {refUrl && (
          <div className="bg-indigo-50 rounded-2xl p-5 text-left">
            <p className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share your link — every referral gets your area closer to 60%
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-600 font-mono truncate">
                {refUrl}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={shareLink}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-100 text-sm font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share with Neighbors
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            type="text"
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            required
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            placeholder="Los Angeles"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            type="text"
            placeholder="CA"
            maxLength={2}
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm uppercase"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={!form.email || loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-base transition-colors"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
        {loading ? "Getting you set up…" : "Get Updates on My Area"}
      </button>
      <p className="text-center text-xs text-gray-400">
        No spam. Unsubscribe anytime. We email progress updates + your unique referral link.
      </p>
    </form>
  );
}
