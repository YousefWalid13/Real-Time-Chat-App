import { useState } from "react";
import { C } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

/**
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ChangePasswordModal open={open} onClose={() => setOpen(false)} />
 */
export default function ChangePasswordModal({ open, onClose }) {
  const { changePassword } = useAuth();

  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showAll, setShowAll]   = useState(false);
  const [status, setStatus]     = useState(null); // { ok, msg }
  const [loading, setLoading]   = useState(false);

  if (!open) return null;

  const reset = () => {
    setCurrent(""); setNext(""); setConfirm("");
    setStatus(null); setLoading(false);
  };

  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!current || !next || !confirm) {
      setStatus({ ok: false, msg: "All fields are required." });
      return;
    }
    if (next !== confirm) {
      setStatus({ ok: false, msg: "New passwords do not match." });
      return;
    }
    if (next.length < 6) {
      setStatus({ ok: false, msg: "Password must be at least 6 characters." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await changePassword(current, next);
      setStatus({ ok: true, msg: res.message || "Password changed successfully!" });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  const type = showAll ? "text" : "password";

  return (
    <Overlay onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "32px 36px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 3 }}>
              🔐 Change Password
            </h2>
            <p style={{ fontSize: 12, color: C.textMuted }}>
              Update your account password
            </p>
          </div>
          <button onClick={close} style={closeBtnStyle}>✕</button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

        {/* Fields */}
        <Field label="Current Password">
          <input
            type={type}
            style={inputStyle}
            placeholder="Enter current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e)  => (e.target.style.borderColor = C.borderHi)}
          />
        </Field>

        <Field label="New Password">
          <input
            type={type}
            style={inputStyle}
            placeholder="Enter new password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e)  => (e.target.style.borderColor = C.borderHi)}
          />
        </Field>

        <Field label="Confirm New Password" style={{ marginBottom: 16 }}>
          <input
            type={type}
            style={inputStyle}
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e)  => (e.target.style.borderColor = C.borderHi)}
          />
        </Field>

        {/* Show / hide toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 20 }}>
          <div
            onClick={() => setShowAll((p) => !p)}
            style={{
              width: 36, height: 20, borderRadius: 10,
              background: showAll ? C.grad : C.border,
              position: "relative", transition: "background 0.2s", cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 3,
              left: showAll ? 18 : 3,
              width: 14, height: 14,
              borderRadius: "50%", background: C.white,
              transition: "left 0.2s",
            }} />
          </div>
          <span style={{ fontSize: 12, color: C.textMuted }}>Show passwords</span>
        </label>

        {/* Status */}
        {status && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            fontSize: 13,
            background: status.ok ? "#0f2a1a" : "#1f0909",
            border: `1px solid ${status.ok ? "#166534" : "#7f1d1d"}`,
            color: status.ok ? "#4ade80" : C.red,
          }}>
            {status.ok ? "✅" : "⚠"} {status.msg}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={close} style={secondaryBtnStyle}>
            Cancel
          </button>
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
            {loading ? "Saving…" : "Change Password"}
          </button>
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

function Field({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label style={{ display: "block", color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 7 }}>
        {label}
      </label>
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
  transition: "background 0.2s",
};
