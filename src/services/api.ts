/// <reference types="vite/client" />

import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosHeaders,
    AxiosRequestHeaders,
} from "axios";
import { authService } from "@/services/authService";

const rawUrl = (import.meta.env.VITE_API_URL || "/api").toString().trim();
let baseURL = rawUrl.replace(/\/+$|\s+/g, "");
if (!baseURL.toLowerCase().endsWith("/api")) {
    baseURL = `${baseURL}/api`;
}

export interface StoredAuth {
    user?: Record<string, unknown> | null;
    accessToken?: string | null;
    refreshToken?: string | null;
}

const api: AxiosInstance = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

const getStoredAuth = (): StoredAuth | null => {
    const raw = localStorage.getItem("app_auth");
    if (!raw) return null;

    try {
        return JSON.parse(raw) as StoredAuth;
    } catch {
        return null;
    }
};

const setStoredAuth = (auth: StoredAuth | null): void => {
    if (!auth) return;
    localStorage.setItem("app_auth", JSON.stringify(auth));
};

interface FailedQueueItem {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
            return;
        }
        prom.resolve(token || "");
    });
    failedQueue = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!config) return config;

    const auth = getStoredAuth();
    if (!auth?.accessToken) return config;

    const currentHeaders = config.headers ? new AxiosHeaders(config.headers as any) : new AxiosHeaders();
    currentHeaders.set("Authorization", `Bearer ${auth.accessToken}`);
    config.headers = currentHeaders as AxiosRequestHeaders;

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError & { config?: any }) => {
        const originalRequest = error.config;
        if (!originalRequest || !error.response) {
            return Promise.reject(error);
        }

        if (![401, 403].includes(error.response.status) || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const auth = getStoredAuth();

        if (!auth?.refreshToken) {
            localStorage.removeItem("app_auth");
            window.location.href = "/login";
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;

        try {
            const response = await authService.refreshToken(auth.refreshToken);
            const { accessToken, refreshToken: rotatedRefreshToken } = response.data;

            const updatedAuth: StoredAuth = {
                ...auth,
                accessToken,
                refreshToken: rotatedRefreshToken ?? auth.refreshToken,
            };

            setStoredAuth(updatedAuth);
            api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
            processQueue(null, accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            localStorage.removeItem("app_auth");
            window.location.href = "/login";
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
