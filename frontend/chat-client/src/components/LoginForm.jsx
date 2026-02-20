import { useState } from "react";
import { C } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// Shared input style (exported so RegisterForm can reuse)
export const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  background: C.surfaceHi,
  border: `1px solid ${C.borderHi}`,
  borderRadius: 12,
  color: C.white,
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
};

export function Field({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 18, ...style }}>
      <label style={{
        display: "block", color: C.text,
        fontSize: 13, fontWeight: 600, marginBottom: 8,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LoginForm({ onForgotPassword }) {
  const { login } = useAuth();

  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !pass) { setError("Please fill all fields."); return; }
    setError(""); setLoading(true);
    try {
      const data = await api.post("/api/auth/login", { email, password: pass });
      login(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && submit();

  return (
    <div>
      {/* Email */}
      <Field label="Email">
        <div style={{ position: "relative" }}>
          <input
            type="email"
            style={{ ...inputStyle, paddingRight: 44 }}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e)  => (e.target.style.borderColor = C.borderHi)}
          />
          <span style={{
            position: "absolute", right: 14, top: "50%",
            transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none",
          }}>🔒</span>
        </div>
      </Field>

      {/* Password */}
      <Field label="Password" style={{ marginBottom: 8 }}>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            style={{ ...inputStyle, paddingRight: 80 }}
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={onKey}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e)  => (e.target.style.borderColor = C.borderHi)}
          />
          <button onClick={() => setShowPass((p) => !p)} style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)",
            background: C.border, border: "none", borderRadius: 6,
            color: C.textMuted, fontSize: 11,
            padding: "3px 9px", cursor: "pointer", fontWeight: 600,
          }}>
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      {/* Forgot password */}
      <div style={{ textAlign: "right", marginBottom: 20 }}>
        <button onClick={onForgotPassword} style={{
          background: "none", border: "none",
          color: C.purple, fontSize: 12,
          cursor: "pointer", fontWeight: 600, padding: 0,
          textDecoration: "underline", textUnderlineOffset: 2,
        }}>
          Forgot password?
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#1f0909", border: "1px solid #7f1d1d",
          borderRadius: 10, padding: "10px 14px",
          color: C.red, fontSize: 13, marginBottom: 16,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit} disabled={loading}
        style={{
          width: "100%", padding: "13px 0",
          border: "none", borderRadius: 12,
          background: C.grad, color: C.white,
          fontWeight: 700, fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.65 : 1,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => { if (!loading) e.target.style.filter = "brightness(1.1)"; }}
        onMouseLeave={(e) => (e.target.style.filter = "none")}
      >
        {loading ? "Please wait…" : "Login"}
      </button>
    </div>
  );
}
