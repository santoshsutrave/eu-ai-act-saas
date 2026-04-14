"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { surveysApi } from "@/lib/api";
import type { RiskAssessment, SurveyQuestion } from "@/lib/types";
import RiskBadge from "@/components/RiskBadge";
import { RISK_META } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

type Step = "loading" | "survey" | "result";

export default function AssessPage() {
  const { id: systemId } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RiskAssessment | null>(null);

  useEffect(() => {
    Promise.all([
      surveysApi.questions(systemId),
      surveysApi.start(systemId),
    ]).then(([qRes, sRes]) => {
      setQuestions(qRes.data.questions);
      setSessionId(sRes.data.id);
      setStep("survey");
    });
  }, [systemId]);

  const q = questions[current];
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0;

  function handleAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  async function handleNext() {
    if (!answers[q.id]) return;

    setSaving(true);
    await surveysApi.saveAnswers(systemId, sessionId, { [q.id]: answers[q.id] });
    setSaving(false);

    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      // Complete survey
      setSaving(true);
      const r = await surveysApi.complete(systemId, sessionId);
      setSaving(false);
      setResult(r.data);
      setStep("result");
    }
  }

  function handleBack() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  if (step === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (step === "result" && result) {
    return <ResultView result={result} systemId={systemId} />;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/systems/${systemId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back to system
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Risk Assessment Wizard
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Answer the questions to classify your AI system under the EU AI Act.
      </p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-base font-medium text-gray-900 mb-4">{q.text}</p>

        {q.type === "yesno" && (
          <div className="flex gap-3">
            {["yes", "no"].map((val) => (
              <button
                key={val}
                onClick={() => handleAnswer(val)}
                className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                  answers[q.id] === val
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {val === "yes" ? "Yes" : "No"}
              </button>
            ))}
          </div>
        )}

        {q.type === "select" && (
          <select
            value={answers[q.id] || ""}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select an option…</option>
            {q.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {q.type === "textarea" && (
          <textarea
            rows={4}
            value={answers[q.id] || ""}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Describe in detail…"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handleBack}
          disabled={current === 0}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={!answers[q.id] || saving}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            "Saving…"
          ) : current === questions.length - 1 ? (
            <>
              <CheckCircle className="h-4 w-4" /> Complete Assessment
            </>
          ) : (
            <>
              Next <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ResultView({
  result,
  systemId,
}: {
  result: RiskAssessment;
  systemId: string;
}) {
  const meta = RISK_META[result.risk_level];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div
        className={`rounded-2xl border-2 p-8 text-center mb-6 ${meta.bg} ${meta.border}`}
      >
        <div className="text-5xl mb-3">{meta.icon}</div>
        <h2 className={`text-2xl font-bold mb-2 ${meta.color}`}>
          {meta.label}
        </h2>
        <RiskBadge level={result.risk_level} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Regulatory Rationale
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">{result.rationale}</p>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/systems/${systemId}`}
          className="flex-1 text-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          View System Details
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 text-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
