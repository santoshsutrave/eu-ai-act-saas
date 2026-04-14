import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  prohibited: {
    label: "Prohibited",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🚫",
  },
  high: {
    label: "High Risk",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "⚠️",
  },
  limited: {
    label: "Limited Risk",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "⚡",
  },
  minimal: {
    label: "Minimal Risk",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "✅",
  },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
