export type RiskLevel = "prohibited" | "high" | "limited" | "minimal";

export interface User {
  id: string;
  email: string;
  role: "admin" | "contributor" | "auditor";
  org_id: string;
}

export interface AISystem {
  id: string;
  name: string;
  purpose: string;
  sector: string;
  org_id: string;
  owner: string | null;
  created_at: string;
  latest_risk_level: RiskLevel | null;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: "textarea" | "yesno" | "select";
  options?: string[];
}

export interface SurveySession {
  id: string;
  system_id: string;
  answers: Record<string, string>;
  status: "in_progress" | "completed";
  created_at: string;
}

export interface RiskAssessment {
  id: string;
  system_id: string;
  session_id: string;
  risk_level: RiskLevel;
  rationale: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  org_id: string;
  actor: string;
  action: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  total_systems: number;
  prohibited: number;
  high_risk: number;
  limited: number;
  minimal: number;
  pending: number;
}
