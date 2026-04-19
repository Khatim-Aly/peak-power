import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Check } from "lucide-react";

type Mode = "light" | "dark" | "system";

const applyMode = (mode: Mode) => {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", mode === "dark" || (mode === "system" && systemDark));
};

const AppearanceSettings = () => {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Mode | null) ?? "dark";
    setMode(saved);
  }, []);

  const setTheme = (m: Mode) => {
    setMode(m);
    localStorage.setItem("theme", m);
    applyMode(m);
  };

  const options: { value: Mode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <h3 className="text-lg font-serif font-bold mb-2">Appearance</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Choose how PeakPower looks. Pick "System" to follow your device theme automatically.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {options.map(({ value, label, icon: Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              }`}
            >
              {active && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div className="w-full h-16 sm:h-20 rounded-lg mb-3 border flex items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <p className="text-sm font-medium">{label}</p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AppearanceSettings;
