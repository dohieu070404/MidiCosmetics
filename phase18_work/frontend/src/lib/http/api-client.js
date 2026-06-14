import axios from "axios";

import { env } from "@/config/env";
import { API_TIMEOUT_MS } from "@/constants/api";
import { normalizeApiError } from "@/lib/http/api-error";
import { useAuthStore } from "@/stores/auth-store";

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const shouldAttachAccessToken = (url = '') => {
  const path = String(url);
  return path.startsWith('/admin') || path === '/auth/me' || path === '/auth/logout';
};

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && shouldAttachAccessToken(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    const isAuthRefresh = original?.url?.includes("/auth/refresh");
    const isAuthLogin = original?.url?.includes("/auth/login");

    if (status === 401 && original && !original._retry && !isAuthRefresh && !isAuthLogin) {
      original._retry = true;
      try {
        refreshPromise ||= apiClient.post("/auth/refresh").finally(() => { refreshPromise = null; });
        const refreshed = await refreshPromise;
        const payload = refreshed?.data ?? refreshed ?? {};
        useAuthStore.getState().setSession({ user: payload.user, tokens: payload.tokens });
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${payload.tokens.accessToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    if (status === 401) useAuthStore.getState().logout();
    return Promise.reject(normalizeApiError(error));
  }
);
