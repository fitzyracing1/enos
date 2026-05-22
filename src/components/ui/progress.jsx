import { cn } from "@/lib/utils";

export function Progress({ value = 0, className, ...props }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-100", className)} {...props}>
      <div
        className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
      {value >= 60 && (
        <div className="absolute inset-0 bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, value)}%` }} />
      )}
    </div>
  );
}
