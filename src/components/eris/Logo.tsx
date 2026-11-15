import { Link } from "@tanstack/react-router";

export function ErisMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <span className={`relative inline-flex ${box} shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card font-semibold lowercase text-primary`} aria-hidden>
      e
      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
    </span>
  );
}

export function ErisLogo({ to = "/", compact = false, inverse = false }: { to?: "/" | "/preview"; compact?: boolean; inverse?: boolean }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-3" aria-label="ERIS — Trang chủ">
      <ErisMark />
      <span className="min-w-0">
        <span className={`block text-lg font-bold tracking-[0.16em] ${inverse ? "text-primary-foreground" : "text-foreground"}`}>ERIS</span>
        {!compact && <span className={`block text-[9px] font-medium uppercase tracking-[0.18em] ${inverse ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Retention Intelligence</span>}
      </span>
    </Link>
  );
}
