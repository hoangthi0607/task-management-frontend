import api from "@/services/api";

export const reportService = {
  getAll: () => api.get("/reports"),
  getById: (id: number) => api.get(`/reports/${id}`),
  getByProject: (projectId: number) => api.get(`/reports/project/${projectId}`),
  create: (payload: unknown) => api.post("/reports", payload),
  generateProjectReport: (projectId: number) => api.post(`/reports/project/${projectId}/generate`),
  update: (id: number, payload: unknown) => api.patch(`/reports/${id}`, payload),
  delete: (id: number) => api.delete(`/reports/${id}`),
};
