import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-2xl bg-white border border-gray-100 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return <div className={cn("p-6 pb-0", className)} {...props}>{children}</div>;
}

export function CardContent({ className, children, ...props }) {
  return <div className={cn("p-6", className)} {...props}>{children}</div>;
}
