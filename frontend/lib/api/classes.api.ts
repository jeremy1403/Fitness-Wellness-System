import { backendUrl } from "./backend";

export interface FitnessClassData {
  title: string;
  description: string;
  duration_minutes: number;
  capacity?: number;
  status?: string; 
  setup_mode?: 'simple' | 'automated';
  class_type?: 'Yoga' | 'Spin' | 'HIIT' | 'General';
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
    throw { response: { data: errorData, status: response.status } }; // 包装成兼容 error.response 的格式
  }
  return await response.json();
};


export const updateFitnessClass = async (id: number, data: FitnessClassData) => {
  const url = backendUrl(`/classes/${id}`);
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
    throw { response: { data: errorData, status: response.status } };
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