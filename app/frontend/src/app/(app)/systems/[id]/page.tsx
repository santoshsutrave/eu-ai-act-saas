"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { systemsApi } from "@/lib/api";
import type { AISystem } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { formatDate, RISK_META } from "@/lib/utils";
import {
  ChevronLeft,
  ClipboardCheck,
  Building2,
  Tag,
  Calendar,
  FileText,
} from "lucide-react";

export default function SystemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [system, setSystem] = useState<AISystem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    systemsApi
      .get(id)
      .then((r) => setSystem(r.data))
      .catch(() => router.push("/systems"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!system) return null;

  const riskMeta = system.latest_risk_level
    ? RISK_META[system.latest_risk_level]
    : null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/systems"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back to systems
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{system.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{system.sector}</p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={system.latest_risk_level} />
          <Link
            href={`/systems/${system.id}/assess`}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <ClipboardCheck className="h-4 w-4" />
            {system.latest_risk_level ? "Re-assess" : "Start Assessment"}
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <Detail
          icon={<FileText className="h-4 w-4" />}
          label="Purpose"
          value={system.purpose}
        />
        <Detail
          icon={<Tag className="h-4 w-4" />}
          label="Sector"
          value={system.sector}
        />
        <Detail
          icon={<Building2 className="h-4 w-4" />}
          label="Organisation ID"
          value={system.org_id}
          mono
        />
        <Detail
          icon={<Calendar className="h-4 w-4" />}
          label="Registered"
          value={formatDate(system.created_at)}
        />
      </div>

      {/* Risk result card */}
      {riskMeta && system.latest_risk_level && (
        <div
          className={`mt-6 rounded-xl border p-5 ${riskMeta.bg} ${riskMeta.border}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{riskMeta.icon}</span>
            <h2 className={`font-semibold ${riskMeta.color}`}>
              {riskMeta.label} Classification
            </h2>
          </div>
          <ComplianceChecklist level={system.latest_risk_level} />
        </div>
      )}

      {!system.latest_risk_level && (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-400 text-sm">
            No risk assessment completed yet.
          </p>
          <Link
            href={`/systems/${system.id}/assess`}
            className="mt-3 inline-block text-sm text-brand-600 hover:underline"
          >
            Start the assessment wizard
          </Link>
        </div>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p
          className={`text-sm text-gray-900 mt-0.5 ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ComplianceChecklist({ level }: { level: string }) {
  const items: Record<string, string[]> = {
    prohibited: [
      "System must NOT be deployed or put into service",
      "Contact legal team immediately",
      "Review Article 5 of the EU AI Act",
      "Consider redesigning the system to remove prohibited features",
    ],
    high: [
      "Conduct conformity assessment before deployment",
      "Prepare technical documentation (Annex IV)",
      "Implement human oversight mechanisms",
      "Register system in the EU AI database",
      "Establish post-market monitoring plan",
      "Implement logging and audit trail",
      "Ensure data governance measures",
    ],
    limited: [
      "Disclose to users they are interacting with an AI system",
      "Label AI-generated content appropriately",
      "Implement transparency measures per Article 50",
    ],
    minimal: [
      "No mandatory compliance obligations",
      "Consider voluntary AI Code of Practice",
      "Document system for internal governance",
    ],
  };

  return (
    <ul className="mt-3 space-y-1.5">
      {(items[level] || []).map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 text-current opacity-60">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
