export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        counter: {
          canvas: "#F7F6F2",
          surface: "#FFFFFF",
          border: "#E5E2DA",
          ink: "#1C1917",
          muted: "#78716C",
          "dark-canvas": "#111315",
          "dark-surface": "#181B1E",
          "dark-border": "#282C32",
          "dark-ink": "#F3F2EE",
          "dark-muted": "#9CA3AF",
        },
      },
    },
  },
  plugins: [],
};
