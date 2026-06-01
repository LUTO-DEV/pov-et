import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pov: {
          sky: "#87CEEB", // Light cloudy blue from logo
          cloud: "#F0F8FF",
          earth: "#2E8B57", // The green hill
          dark: "#1A1A1A",
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'], // Clean Apple/Arc feel
      },
    },
  },
  plugins: [],
};
export default config;