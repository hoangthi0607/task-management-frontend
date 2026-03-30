import api from "@/services/api";

export const projectService = {
  getAll: () => api.get("/projects"),
  getById: (id: number) => api.get(`/projects/${id}`),
  getByManager: (managerId: number) => api.get(`/projects/manager/${managerId}`),
  create: (payload: unknown) => api.post("/projects", payload),
  update: (id: number, payload: unknown) => api.patch(`/projects/${id}`, payload),
  delete: (id: number) => api.delete(`/projects/${id}`),
};
