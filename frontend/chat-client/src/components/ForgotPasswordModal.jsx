import { useState } from "react";
import { C } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

/**
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ForgotPasswordModal open={open} onClose={() => setOpen(false)} />
 */
export default function ForgotPasswordModal({ open, onClose }) {
  const { forgotPassword } = useAuth();

  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState(null); // { ok, msg, token? }
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => { setEmail(""); setStatus(null); setLoading(false); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!email.trim()) { setStatus({ ok: false, msg: "Please enter your email." }); return; }
    setLoading(true); setStatus(null);
    try {
      const res = await forgotPassword(email.trim());
      setStatus({
        ok: true,
        msg: res.message || "Reset link sent if the email exists.",
        token: res.resetToken, // dev-only field from the API
      });
      setEmail("");
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "32px 36px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 3 }}>
              🔑 Forgot Password
            </h2>
            <p style={{ fontSize: 12, color: C.textMuted }}>
              We'll send a reset link to your email
            </p>
          </div>
          <button onClick={close} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

        {/* Email field (only show if not yet sent) */}
        {!status?.ok && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                style={{ ...inputStyle, paddingRight: 44 }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                onBlur={(e)  => (e.target.style.borderColor = C.borderHi)}
              />
              <span style={{
                position: "absolute", right: 14, top: "50%",
                transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none",
              }}>📧</span>
            </div>
          </div>
        )}

        {/* Status message */}
        {status && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, marginBottom: 20,
            fontSize: 13, lineHeight: 1.6,
            background: status.ok ? "#0f2a1a" : "#1f0909",
            border: `1px solid ${status.ok ? "#166534" : "#7f1d1d"}`,
            color: status.ok ? "#4ade80" : C.red,
          }}>
            {status.ok ? "✅" : "⚠"} {status.msg}

            {/* Dev-only: show reset token returned by API */}
            {status.token && (
              <div style={{
                marginTop: 10, padding: "8px 10px",
                background: "#1a1a28", borderRadius: 8,
                border: `1px solid ${C.borderHi}`,
              }}>
                <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>
                  🛠 Dev token (remove in production):
                </p>
                <code style={{
                  fontSize: 11, color: C.purple,
                  wordBreak: "break-all", lineHeight: 1.5,
                }}>
                  {status.token}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={close} style={secondaryBtnStyle}>
            {status?.ok ? "Close" : "Cancel"}
          </button>

          {!status?.ok && (
            <button
              onClick={submit}
              disabled={loading}
              style={{
                flex: 1, padding: "12px 0",
                border: "none", borderRadius: 12,
                background: C.grad, color: C.white,
                fontWeight: 700, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.65 : 1,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => (e.target.style.filter = "none")}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          )}

          {status?.ok && (
            <button
              onClick={() => { setStatus(null); }}
              style={{
                flex: 1, padding: "12px 0",
                border: "none", borderRadius: 12,
                background: C.surfaceHi, color: C.purple,
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              Try another email
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Overlay({ onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(4px)",
      }}
    >
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px",
  background: C.surfaceHi,
  border: `1px solid ${C.borderHi}`,
  borderRadius: 11, color: C.white,
  fontSize: 14, outline: "none",
  transition: "border-color 0.2s",
};

const closeBtnStyle = {
  background: C.surfaceHi, border: "none",
  width: 32, height: 32, borderRadius: "50%",
  color: C.textMuted, fontSize: 14,
  cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
};

const secondaryBtnStyle = {
  flex: 1, padding: "12px 0",
  border: `1px solid ${C.borderHi}`,
  borderRadius: 12, background: "transparent",
  color: C.textMuted, fontWeight: 600,
  fontSize: 14, cursor: "pointer",
};
