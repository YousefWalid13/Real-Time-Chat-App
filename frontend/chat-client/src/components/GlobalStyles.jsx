import { useEffect } from "react";
import { GLOBAL_CSS } from "../utils/constants";

export default function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.innerHTML = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  return null;
}
