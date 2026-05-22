import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-indigo-100 text-indigo-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    destructive: "bg-red-100 text-red-700",
    outline: "border border-gray-200 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
