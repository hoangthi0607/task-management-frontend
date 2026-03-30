import api from "@/services/api";

export const roleService = {
  getAll: () => api.get("/roles"),
  getById: (id: number) => api.get(`/roles/${id}`),
  create: (payload: unknown) => api.post("/roles", payload),
  update: (id: number, payload: unknown) => api.patch(`/roles/${id}`, payload),
  delete: (id: number) => api.delete(`/roles/${id}`),
};
