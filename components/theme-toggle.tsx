"use client";

import { useEffect, useState } from "react";
import { ThemeIcon } from "./icons";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ztn-theme");
    const next = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("ztn-theme", next ? "dark" : "light");
  }

  return (
    <button className="icon-button glass-button" onClick={toggle} aria-label={dark ? "Use light mode" : "Use dark mode"}>
      <ThemeIcon dark={dark} />
    </button>
  );
}
