import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function StatePanel({ type = "empty", title, description, actionLabel, onAction, className = "" }) {
  const Icon = type === "loading" ? LoaderCircle : type === "error" ? AlertTriangle : Inbox;
  return (
    <div className={`grid min-h-56 place-items-center rounded-2xl border border-dashed border-border bg-card/55 px-6 py-12 text-center shadow-sm ${className}`}>
      <div className="max-w-md">
        <Icon className={`mx-auto size-6 text-primary ${type === "loading" ? "animate-spin" : ""}`} />
        <h2 className="mt-4 font-display text-2xl font-normal tracking-[-0.03em]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p> : null}
        {actionLabel && onAction ? <Button type="button" variant="outline" className="mt-5" onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </div>
  );
}
