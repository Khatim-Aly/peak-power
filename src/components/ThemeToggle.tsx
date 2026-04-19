import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "light" | "dark" | "system";

const applyMode = (mode: Mode) => {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = mode === "dark" || (mode === "system" && systemDark);
  document.documentElement.classList.toggle("dark", useDark);
};

const getStoredMode = (): Mode => {
  const saved = (localStorage.getItem("theme") as Mode | null) || null;
  return saved ?? "dark"; // default dark
};

const ThemeToggle = () => {
  const [mode, setMode] = useState<Mode>("dark");

  // Initial mount: read mode + apply (script in index.html already set the class, this keeps state in sync)
  useEffect(() => {
    const m = getStoredMode();
    setMode(m);
    applyMode(m);
  }, []);

  // Listen to OS changes when in 'system' mode
  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyMode("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  const cycle = useCallback(() => {
    // Cycle: dark -> light -> system -> dark
    const next: Mode = mode === "dark" ? "light" : mode === "light" ? "system" : "dark";
    setMode(next);
    localStorage.setItem("theme", next);
    applyMode(next);
  }, [mode]);

  const Icon = mode === "dark" ? Sun : mode === "light" ? Moon : Monitor;
  const label =
    mode === "dark" ? "Switch to light mode" : mode === "light" ? "Use system theme" : "Switch to dark mode";

  return (
    <motion.button
      onClick={cycle}
      className="relative p-2 rounded-full bg-muted/50 hover:bg-muted border border-border/50 hover:border-gold/30 transition-all duration-300"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
      title={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-5 h-5 text-gold" />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
