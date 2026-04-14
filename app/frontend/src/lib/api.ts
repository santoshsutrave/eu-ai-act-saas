import axios from "axios";
import type {
  AISystem,
  AuditLog,
  DashboardStats,
  RiskAssessment,
  SurveyQuestion,
  SurveySession,
  User,
} from "./types";

const api = axios.create({ baseURL: "/api" });

// Attach auth token
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (email: string, password: string, org_name: string) =>
    api.post<{ access_token: string }>("/auth/register", {
      email,
      password,
      org_name,
    }),
  login: (email: string, password: string) =>
    api.post<{ access_token: string }>("/auth/login", { email, password }),
  me: () => api.get<User>("/auth/me"),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard"),
};

// AI Systems
export const systemsApi = {
  list: () => api.get<AISystem[]>("/systems"),
  get: (id: string) => api.get<AISystem>(`/systems/${id}`),
  create: (data: { name: string; purpose: string; sector: string }) =>
    api.post<AISystem>("/systems", data),
  delete: (id: string) => api.delete(`/systems/${id}`),
};

// Surveys
export const surveysApi = {
  questions: (systemId: string) =>
    api.get<{ questions: SurveyQuestion[] }>(
      `/systems/${systemId}/surveys/questions`
    ),
  start: (systemId: string) =>
    api.post<SurveySession>(`/systems/${systemId}/surveys`),
  saveAnswers: (
    systemId: string,
    sessionId: string,
    answers: Record<string, string>
  ) =>
    api.patch<SurveySession>(
      `/systems/${systemId}/surveys/${sessionId}`,
      { answers }
    ),
  complete: (systemId: string, sessionId: string) =>
    api.post<RiskAssessment>(
      `/systems/${systemId}/surveys/${sessionId}/complete`
    ),
  getAssessment: (systemId: string, sessionId: string) =>
    api.get<RiskAssessment>(
      `/systems/${systemId}/surveys/${sessionId}/assessment`
    ),
};

// Audit logs
export const auditApi = {
  list: (limit = 50, offset = 0) =>
    api.get<AuditLog[]>(`/audit?limit=${limit}&offset=${offset}`),
};

export default api;
