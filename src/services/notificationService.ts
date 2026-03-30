import api from "@/services/api";

export const notificationService = {
  getAll: () => api.get("/notifications"),
  getById: (id: number) => api.get(`/notifications/${id}`),
  getByUser: (userId: number) => api.get(`/notifications/user/${userId}`),
  getByTask: (taskId: number) => api.get(`/notifications/task/${taskId}`),
  create: (payload: unknown) => api.post("/notifications", payload),
  update: (id: number, payload: unknown) => api.patch(`/notifications/${id}`, payload),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};
