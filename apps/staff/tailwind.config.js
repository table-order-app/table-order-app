/** @type {import('tailwindcss').Config} */
module.exports = {
  // 共通設定をプリセットとして使用
  presets: [require("../../packages/ui/tailwind.config.js")],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // 共通UIパッケージも検出対象に含める
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // アプリ固有の拡張（必要に応じて）
    },
  },
};
