import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b101a",
        shell: "#111827",
        panel: "#101726",
        mist: "#d9dfeb",
        amber: "#f0a54a",
        ember: "#ff7a3d",
        teal: "#3fd2c7"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(63,210,199,0.24), 0 12px 40px rgba(11,16,26,0.35)"
      },
      backgroundImage: {
        aurora: "radial-gradient(circle at top left, rgba(63,210,199,0.12), transparent 30%), radial-gradient(circle at top right, rgba(240,165,74,0.2), transparent 32%), linear-gradient(160deg, #09111d 0%, #101726 52%, #1e1a21 100%)"
      }
    }
  },
  plugins: []
};

export default config;
