import { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // アプリ固有の拡張（必要に応じて）
      animation: {
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
        "fade-out-down": "fadeOutDown 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
        "soft-appear": "softAppear 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "soft-disappear":
          "softDisappear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px) translateX(-50%)",
            filter: "blur(5px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) translateX(-50%)",
            filter: "blur(0)",
          },
        },
        fadeOutDown: {
          "0%": {
            opacity: "1",
            transform: "translateY(0) translateX(-50%)",
            filter: "blur(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(20px) translateX(-50%)",
            filter: "blur(5px)",
          },
        },
        softAppear: {
          "0%": {
            opacity: "0",
            transform: "scale(0.95) translateX(-50%)",
            filter: "blur(5px)",
          },
          "50%": {
            opacity: "0.7",
            transform: "scale(1.02) translateX(-50%)",
            filter: "blur(2px)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translateX(-50%)",
            filter: "blur(0)",
          },
        },
        softDisappear: {
          "0%": {
            opacity: "1",
            transform: "scale(1) translateX(-50%)",
            filter: "blur(0)",
          },
          "100%": {
            opacity: "0",
            transform: "scale(0.95) translateX(-50%)",
            filter: "blur(5px)",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  // Cloudflare Pages用に動的に生成されるクラスをセーフリストに追加
  safelist: [
    "border-t-[#e0815e]",
    "bg-[#e0815e]",
    "hover:bg-[#d3704f]",
    "text-[#e0815e]",
    "border-[#e0815e]",
    "bg-[#fffafa]",
    "animate-fade-in-up",
    "animate-fade-out-down",
    "animate-soft-appear",
    "animate-soft-disappear",
    "bg-green-500/90",
    "bg-red-500/90",
    "bg-blue-500/90",
    "bg-yellow-500/90",
    "bg-green-500",
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
  ],
};

export default config;
