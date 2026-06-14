import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, align = "left", className }) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">{eyebrow}</p> : null}
      <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">{title}</h2>
      {description ? <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">{description}</p> : null}
    </div>
  );
}
