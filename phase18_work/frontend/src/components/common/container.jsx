import { cn } from "@/lib/utils";

export function Container({ className, ...props }) {
  return <div className={cn("luxury-container", className)} {...props} />;
}
