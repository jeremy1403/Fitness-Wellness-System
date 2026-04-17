import { backendUrl } from "./backend";
import { http } from "./http";

type SchedulesIndexResponse<T> = {
  request_status?: string;
  timestamp?: string;
  data: T[];
};

function readSchedulesData<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === "object" && value !== null && "data" in value) {
    const data = (value as { data?: unknown }).data;

    if (Array.isArray(data)) {
      return data as T[];
    }
  }

  throw new Error("Invalid schedules response received from backend.");
}

// 1. 获取所有排课列表 (Read)
export const getSchedules = async <T = any>(): Promise<T[]> => {
  const url = backendUrl("/schedules");
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch schedules");
  const body = await response.json() as SchedulesIndexResponse<T> | T[];
  return readSchedulesData<T>(body);
};

// 2. 创建新排课 (Create)
export const createSchedule = async (data: any) => {
  const url = backendUrl("/schedules");
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { message: errorData.message || "Failed", errors: errorData.errors };
  }
  return await response.json();
};

// 3. 删除排课 (Delete)
export const deleteSchedule = async (id: number) => {
  const url = backendUrl(`/schedules/${id}`);
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) throw new Error("Delete failed");
  return true;
};

// 4. 获取教练列表 (用于填充下拉框) — goes through /api/backend proxy so the Sanctum token is attached.
export const getTrainers = async () => {
  const body = await http<{
    request_status?: string;
    timestamp?: string;
    data: Array<{ id: number; name: string; specialty: string }>;
  }>("/auth/trainers", {
    method: "GET",
    credentials: "include",
  });
  return body.data;
};

// 5. 更新排课 (Update)
export const updateSchedule = async (id: number | string, data: any) => {
  const url = backendUrl(`/schedules/${id}`);
  const response = await fetch(url, {
    method: "PUT", 
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { message: errorData.message || "Update failed", errors: errorData.errors };
  }
  return await response.json();
};
