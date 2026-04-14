import { cn, RISK_META } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

interface Props {
  level: RiskLevel | null | undefined;
  size?: "sm" | "md";
}

export default function RiskBadge({ level, size = "md" }: Props) {
  if (!level) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border font-medium",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
          "bg-gray-50 border-gray-200 text-gray-500"
        )}
      >
        Pending
      </span>
    );
  }

  const meta = RISK_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        meta.bg,
        meta.border,
        meta.color
      )}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
