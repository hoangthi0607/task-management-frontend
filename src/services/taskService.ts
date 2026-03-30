import api from "@/services/api";

export const taskService = {
  getAll: () => api.get("/tasks"),
  getById: (id: number) => api.get(`/tasks/${id}`),
  getByProject: (projectId: number) => api.get(`/tasks/project/${projectId}`),
  create: (payload: unknown) => api.post("/tasks", payload),
  update: (id: number, payload: unknown) => api.patch(`/tasks/${id}`, payload),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};
