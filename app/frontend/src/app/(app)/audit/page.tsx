"use client";

import { useEffect, useState } from "react";
import { auditApi } from "@/lib/api";
import type { AuditLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const ACTION_COLOR: Record<string, string> = {
  "user.register": "bg-blue-100 text-blue-700",
  "user.login": "bg-gray-100 text-gray-600",
  "system.create": "bg-green-100 text-green-700",
  "system.delete": "bg-red-100 text-red-700",
  "assessment.complete": "bg-purple-100 text-purple-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    auditApi
      .list(100)
      .then((r) => setLogs(r.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 text-sm mt-1">
            Immutable record of all compliance events
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200 text-center">
          <p className="text-gray-400 text-sm">No audit events yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Event</th>
                <th className="px-5 py-3 text-left font-medium">Actor</th>
                <th className="px-5 py-3 text-left font-medium">Payload</th>
                <th className="px-5 py-3 text-left font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ACTION_COLOR[log.action] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">
                    {log.actor}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 font-mono text-xs max-w-[300px] truncate">
                    {log.payload ? JSON.stringify(log.payload) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
