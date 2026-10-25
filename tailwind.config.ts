import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#202020", ivory: "#F6F0E6", oak: "#C4945D", brass: "#A67C52", sand: "#E8DDCB",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        omegle: ["var(--font-omegle)", "'OMEGLE'", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
