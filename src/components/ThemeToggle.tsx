'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      aria-label="Toggle Theme"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative inline-flex h-8 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 transition-colors hover:bg-white/30 dark:bg-gray-800/20 dark:border-gray-700/30 dark:hover:bg-gray-800/30"
    >
      <div className="relative flex h-6 w-12 items-center">
        <div
          className={`absolute left-1 top-0.5 h-5 w-5 rounded-full bg-blue-500 shadow-lg transition-transform duration-200 ${
            theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
        <Sun className="absolute left-1.5 h-3 w-3 text-yellow-500 opacity-100 dark:opacity-0 transition-opacity" />
        <Moon className="absolute right-1.5 h-3 w-3 text-blue-300 opacity-0 dark:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}
