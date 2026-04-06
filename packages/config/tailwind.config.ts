import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pangea Pay brand palette
        primary: {
          DEFAULT: "#1E4D8C", // Ocean Blue
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2A9D8F", // Teal
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#E9A820", // Warm Gold
          foreground: "#1A2332",
        },
        background: "#F7F9FC",   // Soft White
        surface: "#FFFFFF",       // White
        foreground: "#1A2332",    // Deep Charcoal
        muted: {
          DEFAULT: "#F7F9FC",
          foreground: "#64748B",  // Slate
        },
        success: "#22C55E",
        warning: "#F59E0B",
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#1E4D8C",
      },
      fontFamily: {
        heading: ["Lato", "sans-serif"],
        body: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
