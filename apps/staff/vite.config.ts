import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // 環境変数を安全にロード
  const env = loadEnv(mode, process.cwd(), "");

  // 開発環境では.env、本番環境では環境変数から値を取得
  const port = parseInt(env.VITE_PORT_STAFF || "3004");

  return {
    plugins: [react()],
    server: {
      port,
      host: true,
      strictPort: true,
    },
    // AWS S3 + CloudFront対応の設定
    build: {
      // ソースマップを生成（デバッグに役立つ）
      sourcemap: true,
      // S3用の最適化
      rollupOptions: {
        output: {
          manualChunks: {
            // ベンダーライブラリを分離してキャッシュ効率向上
            vendor: ['react', 'react-dom'],
            router: ['react-router']
          }
        }
      },
      // アセットファイル名の設定（CloudFrontキャッシュ用）
      assetsDir: 'assets',
      // gzip圧縮対応
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      }
    },
    // SPA用のルーティング設定
    base: mode === 'production' ? '/' : '/',
    define: {
      // 本番環境でのグローバル変数定義
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
    }
  };
});
