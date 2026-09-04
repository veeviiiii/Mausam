/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Mirrors FONT_STACKS in src/design/tokens.ts — see CLAUDE.md typography rules.
        ui: [
          '"Google Sans Flex"',
          "Figtree",
          '"Noto Sans Devanagari"',
          "-apple-system",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
        mono: ['"Google Sans Code"', "ui-monospace", '"Cascadia Mono"', "Menlo", "monospace"],
      },
      colors: {
        // IMD warning colour codes. Semantic only — never used as a brand accent.
        warn: {
          green: "#188A4C",
          yellow: "#C9990C",
          orange: "#DE6C10",
          red: "#C92E22",
        },
      },
    },
  },
  plugins: [],
};
