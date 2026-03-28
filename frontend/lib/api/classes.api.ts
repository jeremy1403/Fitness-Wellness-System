import { backendUrl } from "./backend";

export interface FitnessClassData {
  title: string;
  description: string;
  duration_minutes: number;
  capacity?: number;
}

// 获取列表 (Read)
export const getFitnessClasses = async () => {
  const url = backendUrl("/classes");
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch classes");
  return await response.json();
};

// 创建课程 (Create)
export const createFitnessClass = async (data: FitnessClassData) => {
  // 注意：如果你已经在 Laravel Middleware 里放行了 api/*，下面这步可以注释掉
  await fetch(backendUrl("/sanctum/csrf-cookie"), {
    method: "GET",
    credentials: "include",
    headers: { "Accept": "application/json" },
  });

  const url = backendUrl("/classes");
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

// 删除课程 (Delete)
export const deleteFitnessClass = async (id: number) => {
  const url = backendUrl(`/classes/${id}`);
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: { "Accept": "application/json" },
  });
  if (!response.ok) throw new Error("Delete failed");
  return true;
};