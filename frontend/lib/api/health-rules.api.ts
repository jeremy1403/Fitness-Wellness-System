import { http } from "./http";

export interface HealthAlertRule {
  id: number;
  metric: string;
  operator: string;
  threshold: number;
  recommendation_text: string;
  priority: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const getHealthRules = () => http<HealthAlertRule[]>("/admin/health-rules");
export const createHealthRule = (data: Partial<HealthAlertRule>) => http<HealthAlertRule>("/admin/health-rules", { method: "POST", body: data });
export const updateHealthRule = (id: number, data: Partial<HealthAlertRule>) => http<HealthAlertRule>(`/admin/health-rules/${id}`, { method: "PUT", body: data });
export const deleteHealthRule = (id: number) => http<void>(`/admin/health-rules/${id}`, { method: "DELETE" });
export const getHealthRule = (id: number) => http<HealthAlertRule>(`/admin/health-rules/${id}`);
