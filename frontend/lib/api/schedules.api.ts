import { backendUrl } from "./backend";

// 1. 获取所有排课列表 (Read)
export const getSchedules = async () => {
  const url = backendUrl("/schedules");
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch schedules");
  return await response.json();
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

// 4. 获取教练列表 (用于填充下拉框)
export const getTrainers = async () => {
  const url = backendUrl("/trainers");
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch trainers");
  return await response.json();
};

// 5. 更新排课 (Update)
export const updateSchedule = async (id: number | string, data: any) => {
  const url = backendUrl(`/schedules/${id}`);
  const response = await fetch(url, {
    method: "PUT", // 或者根据你的后端 API 使用 "PATCH"
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