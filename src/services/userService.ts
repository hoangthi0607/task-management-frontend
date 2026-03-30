import api from "@/services/api";

export const userService = {
  create: (payload: unknown) => api.post("/users", payload),
  getAll: () => api.get("/users"),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, payload: unknown) => api.patch(`/users/${id}`, payload),
  delete: (id: number) => api.delete(`/users/${id}`),
};
