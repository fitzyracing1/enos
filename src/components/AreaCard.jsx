import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, DollarSign, CheckCircle, ArrowRight, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import JoinDialog from "@/components/JoinDialog";

export default function AreaCard({ area, isMember = false, onJoined }) {
  const [joinOpen, setJoinOpen] = useState(false);
  const targetMembers = area.target_members || 500;
  const currentMembers = area.current_members || 0;
  const pct = Math.min(100, (currentMembers / targetMembers) * 100);
  const goalReached = pct >= 60 || area.goal_reached;

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
          <img
            src={area.image_url || `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80`}
            alt={area.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 right-3">
            {goalReached ? (
              <Badge variant="success" className="shadow-md">
                <CheckCircle className="w-3 h-3" /> Goal Reached!
              </Badge>
            ) : (
              <Badge className="bg-white/90 text-gray-700 shadow-md">
                {pct.toFixed(0)}% to goal
              </Badge>
            )}
          </div>

          {/* Location */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/90 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            {area.city}, {area.state}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-lg mb-1">{area.name}</h3>
          {area.description && (
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{area.description}</p>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{currentMembers.toLocaleString()} members</span>
              <span>Goal: {targetMembers.toLocaleString()}</span>
            </div>
            <Progress value={pct} />
            <div className="flex items-center gap-1 mt-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <p className="text-xs text-gray-500">60% unlocks subsidized improvements</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mb-5 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>{currentMembers.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>${(area.monthly_pool || 0).toLocaleString()}/mo pool</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <Link
              to={`/AreaDetails?id=${area.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition-colors"
            >
              View Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {isMember ? (
              <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Joined
              </span>
            ) : (
              <button
                onClick={() => setJoinOpen(true)}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-colors ${
                  goalReached ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {goalReached ? "View Benefits" : "Join — $1/mo"}
              </button>
            )}
          </div>
        </div>
      </Card>

      <JoinDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        area={area}
        onSuccess={() => {
          setJoinOpen(false);
          onJoined?.();
        }}
      />
    </>
  );
}
