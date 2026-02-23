export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090f",
        surface: "#111118",
        "surface-hi": "#1a1a28",
        border: "#1e1e30",
        "border-hi": "#2e2e48",
        purple: "#a78bfa",
        pink: "#f472b6",
        text: "#e2e8f0",
        "text-muted": "#6b7280",
        "text-dim": "#374151",
        green: "#34d399",
        red: "#f87171",
        gradStart: "#7c3aed",
        gradEnd: "#ec4899",
      },
      backgroundImage: {
        grad: "linear-gradient(135deg,#7c3aed,#ec4899)",
      },
    },
  },
  plugins: [],
};
