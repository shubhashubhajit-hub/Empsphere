/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        ink2: "var(--color-ink2)",
        panel: "var(--color-panel)",
        panelLine: "var(--color-panel-line)",
        paper: "#F4EFE3",
        gold: "#D6A34C",
        teal: "#59C9BA",
      },
    },
  },
  plugins: [],
}
