import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Check } from "lucide-react";

const AppearanceSettings = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <h3 className="text-lg font-serif font-bold mb-6">Appearance Settings</h3>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">Theme</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Light Theme */}
            <button
              onClick={() => setTheme(false)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                !isDark ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              }`}
            >
              {!isDark && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div className="w-full h-20 bg-gradient-to-br from-white to-gray-100 rounded-lg mb-3 border border-gray-200 flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-sm font-medium">Light</p>
            </button>

            {/* Dark Theme */}
            <button
              onClick={() => setTheme(true)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isDark ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              }`}
            >
              {isDark && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div className="w-full h-20 bg-gradient-to-br from-gray-800 to-gray-950 rounded-lg mb-3 border border-gray-700 flex items-center justify-center">
                <Moon className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm font-medium">Dark</p>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AppearanceSettings;
