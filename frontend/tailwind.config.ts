import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        line: "rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
