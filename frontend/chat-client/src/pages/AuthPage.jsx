import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C } from "../utils/constants";
import AnimatedBg from "../components/AnimatedBg";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [forgotOpen, setForgotOpen] = useState(false);

  const switchTab = (t) => {
    if (t !== tab) setTab(t);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflowY: "auto",
      }}
    >
      <AnimatedBg />
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: "-2px",
          background: C.grad,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        Vion
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          color: C.textMuted,
          fontSize: 14,
          marginBottom: 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        Real-time Chat
      </motion.p>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: 420,
          position: "relative",
          zIndex: 1,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "32px 36px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: C.surfaceHi,
            borderRadius: 14,
            padding: 4,
            marginBottom: 28,
            gap: 4,
          }}
        >
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1,
                padding: "11px 0",
                border: "none",
                cursor: "pointer",
                borderRadius: 11,
                fontWeight: 700,
                fontSize: 14,
                background: tab === t ? C.grad : "transparent",
                color: tab === t ? C.white : C.textMuted,
                transition: "all 0.25s",
                position: "relative",
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Animated form swap */}
        <div style={{ overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.div
                key="login"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <LoginForm onForgotPassword={() => setForgotOpen(true)} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <RegisterForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
