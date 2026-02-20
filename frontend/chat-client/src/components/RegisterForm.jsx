import { useState } from "react";
import { C } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Field, inputStyle } from "./LoginForm";

export default function RegisterForm() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!username || !email || !pass) {
      setError("Username, email and password are required.");
      return;
    }
    if (pass !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (pass.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    const payload = {
      username,
      userName: username,
      email,
      password: pass,
      confirmPassword: confirm,
      fullName,
      displayName: fullName,
    };

    try {
      const data = await api.post("/api/auth/register", payload);
      setSuccess(true);
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
      {/* Username */}
      <Field label="Username">
        <input
          style={inputStyle}
          placeholder="cooluser123"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onKey}
          onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
          onBlur={(e) => (e.target.style.borderColor = C.borderHi)}
        />
      </Field>

      {/* Full Name */}
      <Field label="Full Name (optional)">
        <input
          style={inputStyle}
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={onKey}
          onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
          onBlur={(e) => (e.target.style.borderColor = C.borderHi)}
        />
      </Field>

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
            onBlur={(e) => (e.target.style.borderColor = C.borderHi)}
          />
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              pointerEvents: "none",
            }}
          >
            🔒
          </span>
        </div>
      </Field>

      {/* Password */}
      <Field label="Password">
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            style={{ ...inputStyle, paddingRight: 80 }}
            placeholder="Min. 8 characters"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={onKey}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e) => (e.target.style.borderColor = C.borderHi)}
          />
          <button
            onClick={() => setShowPass((p) => !p)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: C.border,
              border: "none",
              borderRadius: 6,
              color: C.textMuted,
              fontSize: 11,
              padding: "3px 9px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      {/* Confirm password */}
      <Field label="Confirm Password" style={{ marginBottom: 24 }}>
        <input
          type={showPass ? "text" : "password"}
          style={{
            ...inputStyle,
            borderColor: confirm && confirm !== pass ? C.red : C.borderHi,
          }}
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={onKey}
          onFocus={(e) =>
            (e.target.style.borderColor = confirm !== pass ? C.red : "#7c3aed")
          }
          onBlur={(e) =>
            (e.target.style.borderColor =
              confirm && confirm !== pass ? C.red : C.borderHi)
          }
        />
        {confirm && confirm !== pass && (
          <p
            style={{ color: C.red, fontSize: 11, marginTop: 4, paddingLeft: 2 }}
          >
            Passwords don't match
          </p>
        )}
      </Field>

      {/* Success message */}
      {success && (
        <div
          style={{
            background: "#0a1f0a",
            border: "1px solid #14532d",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#4ade80",
            fontSize: 13,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          ✅ Account created successfully! Welcome aboard.
        </div>
      )}

      {/* Error from API */}
      {error && (
        <div
          style={{
            background: "#1f0909",
            border: "1px solid #7f1d1d",
            borderRadius: 10,
            padding: "10px 14px",
            color: C.red,
            fontSize: 13,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px 0",
          border: "none",
          borderRadius: 12,
          background: C.grad,
          color: C.white,
          fontWeight: 700,
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.65 : 1,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!loading) e.target.style.filter = "brightness(1.1)";
        }}
        onMouseLeave={(e) => (e.target.style.filter = "none")}
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </div>
  );
}
