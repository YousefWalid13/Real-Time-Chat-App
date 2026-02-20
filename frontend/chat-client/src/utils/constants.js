// ─── API CONFIG ───────────────────────────────────────────────────────────────
export const API_BASE = "https://real-time-chat-app.fly.dev";
export const HUB_URL = "https://real-time-chat-app.fly.dev/chatHub";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
export const C = {
  bg: "#09090f",
  surface: "#111118",
  surfaceHi: "#1a1a28",
  border: "#1e1e30",
  borderHi: "#2e2e48",
  grad: "linear-gradient(135deg,#7c3aed,#ec4899)",
  purple: "#a78bfa",
  pink: "#f472b6",
  text: "#e2e8f0",
  textMuted: "#6b7280",
  textDim: "#374151",
  green: "#34d399",
  red: "#f87171",
  white: "#ffffff",
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    width: 100%; height: 100%;
    background: ${C.bg};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: ${C.text};
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 4px; }
  input:-webkit-autofill,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #1a1a28 inset !important;
    -webkit-text-fill-color: #ffffff !important;
    caret-color: #ffffff;
  }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-16px); }
  }
  @keyframes floatSlow {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .msg-in { animation: fadeIn 0.2s ease forwards; }
`;
