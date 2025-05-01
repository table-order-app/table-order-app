import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // 環境変数を安全にロード
  const env = loadEnv(mode, process.cwd(), "");

  // Cloudflare Pages対応: process.envの代わりにloadEnvを使用
  // 開発環境では.envから、本番環境ではCloudflare Pages環境変数から値を取得
  const port = parseInt(env.VITE_PORT_ADMIN || "5176");

  return {
    plugins: [react()],
    server: {
      port,
      host: true,
      strictPort: true,
    },
    // Cloudflare Pages用の設定
    build: {
      // ソースマップを生成（デバッグに役立つ）
      sourcemap: true,
    },
  };
});
