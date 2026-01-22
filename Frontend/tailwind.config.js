/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Orange accent (brighter like second image)
        "primary": "#dc512bff",
        "primary-light": "#FF8855",
        "primary-dark": "#E55A2B",
        // Unified dark backgrounds
        "background-dark": "#121212",
        "surface-dark": "#121212",
        "surface-light": "#1A1A1A",
        // Borders
        "border-dark": "#2A2A2A",
        "border-light": "#333333",
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "lg": "1rem",
        "xl": "1.5rem",
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}

