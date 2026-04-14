"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardApi, systemsApi } from "@/lib/api";
import type { AISystem, DashboardStats } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { formatDate, RISK_META } from "@/lib/utils";
import { Plus, TrendingUp, AlertTriangle, ShieldOff, Info } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  prohibited: "#dc2626",
  high: "#ea580c",
  limited: "#ca8a04",
  minimal: "#16a34a",
  pending: "#6b7280",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.stats(), systemsApi.list()])
      .then(([s, sys]) => {
        setStats(s.data);
        setSystems(sys.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const pieData = stats
    ? [
        { name: "Prohibited", value: stats.prohibited, key: "prohibited" },
        { name: "High Risk", value: stats.high_risk, key: "high" },
        { name: "Limited", value: stats.limited, key: "limited" },
        { name: "Minimal", value: stats.minimal, key: "minimal" },
        { name: "Pending", value: stats.pending, key: "pending" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            EU AI Act compliance overview
          </p>
        </div>
        <Link
          href="/systems/new"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Register AI System
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Systems"
          value={stats?.total_systems ?? 0}
          icon={<TrendingUp className="h-5 w-5 text-brand-600" />}
          color="bg-brand-50"
        />
        <StatCard
          label="Prohibited"
          value={stats?.prohibited ?? 0}
          icon={<ShieldOff className="h-5 w-5 text-red-600" />}
          color="bg-red-50"
        />
        <StatCard
          label="High Risk"
          value={stats?.high_risk ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          label="Pending Assessment"
          value={stats?.pending ?? 0}
          icon={<Info className="h-5 w-5 text-gray-500" />}
          color="bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Risk Distribution
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={COLORS[entry.key as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </div>

        {/* Recent systems */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Recent AI Systems
            </h2>
            <Link
              href="/systems"
              className="text-xs text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {systems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-400 text-sm">No AI systems registered yet.</p>
              <Link
                href="/systems/new"
                className="mt-3 text-sm text-brand-600 hover:underline"
              >
                Register your first system
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Sector</th>
                  <th className="pb-2 text-left font-medium">Risk</th>
                  <th className="pb-2 text-left font-medium">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {systems.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-2.5">
                      <Link
                        href={`/systems/${s.id}`}
                        className="font-medium text-gray-900 hover:text-brand-600"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="py-2.5 text-gray-500">{s.sector}</td>
                    <td className="py-2.5">
                      <RiskBadge level={s.latest_risk_level} size="sm" />
                    </td>
                    <td className="py-2.5 text-gray-400">
                      {formatDate(s.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Compliance tips */}
      <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-5">
        <h3 className="font-semibold text-brand-800 text-sm mb-2">
          EU AI Act — Key Obligations
        </h3>
        <ul className="text-xs text-brand-700 space-y-1 list-disc list-inside">
          <li>
            <strong>Prohibited AI</strong> — Systems must not go live (Art. 5)
          </li>
          <li>
            <strong>High-Risk AI</strong> — Conformity assessment, technical
            documentation, human oversight, EU database registration required
          </li>
          <li>
            <strong>Limited Risk AI</strong> — Transparency disclosures to users
            required
          </li>
          <li>
            <strong>General Purpose AI</strong> — Model providers must publish
            training data summaries and copyright compliance info
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
      <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
