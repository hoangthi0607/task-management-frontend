import axios, { AxiosError } from "axios";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { authService } from "@/services/authService";

interface StoredAuth {
  user: Record<string, any> | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue {
  user: Record<string, any> | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  refreshAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "app_auth";

const loadStoredAuth = (): StoredAuth => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, accessToken: null, refreshToken: null };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
};

const saveStoredAuth = ({ user, accessToken, refreshToken }: StoredAuth): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    setUser(stored.user);
    setAccessToken(stored.accessToken);
    setRefreshToken(stored.refreshToken);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("🔐 Logging in with:", { email });
      const response = await authService.login({ email, password });
      console.log("✅ Login response:", response.data);
      
      const { user: loggedUser, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      setUser(loggedUser);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      saveStoredAuth({ user: loggedUser, accessToken: newAccessToken, refreshToken: newRefreshToken });

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Login error:", error);

      if (axios.isAxiosError(error)) {
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
      }

      throw error;
    }
  };

  interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role_id: number;
  }

  const register = async (data: RegisterPayload) => {
    const response = await authService.register(data);

    if (response?.data?.accessToken && response?.data?.refreshToken && response?.data?.user) {
      const { user: registeredUser, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      setUser(registeredUser);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      saveStoredAuth({ user: registeredUser, accessToken: newAccessToken, refreshToken: newRefreshToken });
    }

    return response.data;
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await authService.refreshToken(refreshToken);
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    saveStoredAuth({ user, accessToken: newAccessToken, refreshToken: newRefreshToken });

    return newAccessToken;
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      loading,
      isAuthenticated: !!accessToken,
      login,
      register,
      logout,
      refreshAccessToken,
    }),
    [user, accessToken, refreshToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
};
