/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C63FF",
          light: "#8A84FF",
          dark: "#4F46E5",
        },
        secondary: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#1D4ED8",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        darkBg: "#0F172A",
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'spin-radar': 'spin 6s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(108, 99, 255, 0.2), 0 0 10px rgba(108, 99, 255, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
