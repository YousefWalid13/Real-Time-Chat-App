import { API_BASE } from "./constants";

// Extract useful error message
function extractError(data, fallback = "Request failed") {
  if (!data) return fallback;
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.title === "string" && data.title) return data.title;

  if (
    data.errors &&
    typeof data.errors === "object" &&
    !Array.isArray(data.errors)
  ) {
    const msgs = Object.values(data.errors).flat().filter(Boolean);
    if (msgs.length) return msgs.join(" ");
  }

  if (Array.isArray(data.errors) && data.errors.length)
    return data.errors.join(" ");

  return fallback;
}

// 🔥 دايمًا هات التوكن من sessionStorage
function getToken() {
  const stored = sessionStorage.getItem("_chatAuth");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

const api = {
  post: async (path, body) => {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(extractError(data));
    return data;
  },

  get: async (path) => {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(extractError(data));
    return data;
  },
};

export default api;
