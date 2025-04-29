import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  // Turborepoを通じて共有された環境変数を直接使用
  const port = parseInt(process.env.VITE_PORT_ADMIN || "5176");

  return {
    plugins: [react()],
    server: {
      port,
      host: true,
      strictPort: true,
    },
  };
});
