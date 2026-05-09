/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        "night-dark": "#0f172a",
        "night-mid": "#1e3a5f",
        "warm-yellow": "#FFD6A5",
        "soft-blue": "#A8D8EA",
        cream: "#FFF8F0",
        "soft-pink": "#FFB5C2",
        "light-purple": "#E8D5F5",
      },
      fontFamily: {
        display: ["ZCOOL XiaoWei", "serif"],
        body: ["Noto Sans SC", "sans-serif"],
      },
      animation: {
        twinkle: "twinkle 3s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        slideUp: "slideUp 0.6s ease-out forwards",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        bounceIn: "bounceIn 0.6s ease-out forwards",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
