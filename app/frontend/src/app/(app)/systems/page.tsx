"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { systemsApi } from "@/lib/api";
import type { AISystem } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Trash2, ClipboardCheck } from "lucide-react";

export default function SystemsPage() {
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [filtered, setFiltered] = useState<AISystem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    systemsApi
      .list()
      .then((r) => {
        setSystems(r.data);
        setFiltered(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      systems.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q) ||
          s.purpose.toLowerCase().includes(q)
      )
    );
  }, [search, systems]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this AI system and all its assessments?")) return;
    await systemsApi.delete(id);
    setSystems((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Systems</h1>
          <p className="text-gray-500 text-sm mt-1">
            {systems.length} registered system{systems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/systems/new"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Register System
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search systems…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">
            {search ? "No systems match your search." : "No AI systems yet."}
          </p>
          {!search && (
            <Link
              href="/systems/new"
              className="mt-3 text-sm text-brand-600 hover:underline"
            >
              Register your first AI system
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">Purpose</th>
                <th className="px-5 py-3 text-left font-medium">Sector</th>
                <th className="px-5 py-3 text-left font-medium">Risk Level</th>
                <th className="px-5 py-3 text-left font-medium">Registered</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/systems/${s.id}`}
                      className="font-medium text-gray-900 hover:text-brand-600"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate">
                    {s.purpose}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{s.sector}</td>
                  <td className="px-5 py-3.5">
                    <RiskBadge level={s.latest_risk_level} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">
                    {formatDate(s.created_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {!s.latest_risk_level && (
                        <Link
                          href={`/systems/${s.id}/assess`}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                          title="Start assessment"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          Assess
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
