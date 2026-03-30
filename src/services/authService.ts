import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const authApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role_id: number;
}

export const authService = {
  login: ({ email, password }: LoginPayload) => {
    if (!email || !password) {
      return Promise.reject(new Error("Email and password are required"));
    }
    return authApi.post("/auth/login", { email, password });
  },

  register: (payload: RegisterPayload) => {
    if (!payload || !payload.email || !payload.password) {
      return Promise.reject(new Error("Invalid registration data"));
    }
    return authApi.post("/auth/register", payload);
  },

  refreshToken: (refreshToken: string) => {
    if (!refreshToken) {
      return Promise.reject(new Error("Refresh token is required"));
    }
    return authApi.post("/auth/refresh", { refreshToken });
  },
};
