/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16241F",
        surface: "#F4F6F5",
        panel: "#14232B",
        panel2: "#1C3240",
        steel: {
          400: "#5B93AC",
          500: "#2E6E8E",
          600: "#235774",
        },
        safety: {
          400: "#E58347",
          500: "#D4661E",
          600: "#A94F17",
        },
        gaz: {
          400: "#4F9A6F",
          500: "#2F7D52",
          600: "#245F3F",
        },
        valve: {
          400: "#CB5347",
          500: "#B23A2E",
          600: "#8C2C22",
        },
      },
      fontFamily: {
        display: ["Archivo Narrow", "sans-serif"],
        body: ["Inter", "sans-serif"],
        data: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
