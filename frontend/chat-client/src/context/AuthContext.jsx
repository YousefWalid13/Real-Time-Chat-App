import { createContext, useContext, useState, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const s = sessionStorage.getItem("_chatAuth");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  // ── login ──────────────────────────────────────────────────────────────────
  const login = (data) => {
    const token =
      data.token ||
      data.Token ||
      data.accessToken ||
      data.AccessToken ||
      data.access_token ||
      data.jwt ||
      data.jwtToken;
    const user = data.user ||
      data.User || {
        id: data.id || data.Id || data.userId || data.UserId || data.sub,
        username:
          data.username || data.userName || data.UserName || data.displayName,
        email: data.email || data.Email,
      };
    const obj = { token, user };
    setAuth(obj);
    try {
      sessionStorage.setItem("_chatAuth", JSON.stringify(obj));
    } catch {}
    console.log("LOGIN TOKEN:", token);
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    setAuth(null);
    try {
      sessionStorage.removeItem("_chatAuth");
    } catch {}
  };

  // ── changePassword ─────────────────────────────────────────────────────────
  // POST /api/auth/change-password  (requires Bearer token)
  // body : { currentPassword, newPassword }
  // ok   : { success: true, message }
  // fail : { success: false, errors: string[] }
  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (!auth?.token) throw new Error("Not authenticated");

      const data = await api.post(
        "/api/auth/change-password",
        { currentPassword, newPassword },
        auth.token,
      );

      if (data.success === false) {
        const msg =
          Array.isArray(data.errors) && data.errors.length
            ? data.errors.join(" ")
            : data.message || "Password change failed";
        throw new Error(msg);
      }

      return data;
    },
    [auth?.token],
  );

  // ── forgotPassword ─────────────────────────────────────────────────────────
  // POST /api/auth/forget-password  (public – no token needed)
  // body : { email }
  // ok   : { success: true, message, resetToken? }
  const forgotPassword = useCallback(async (email) => {
    const data = await api.post("/api/auth/forget-password", { email });

    if (data.success === false)
      throw new Error(data.message || "Request failed");

    return data;
  }, []);

  return (
    <AuthContext.Provider
      value={{ auth, login, logout, changePassword, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
