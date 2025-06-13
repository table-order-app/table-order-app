// アプリケーションのルート定義
import { ComponentType } from "react";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import StoreLoginPage from "./pages/StoreLoginPage";

// ルート定義の型
interface RouteDefinition {
  path: string;
  component: ComponentType;
  layout?: ComponentType<{ children: React.ReactNode }>;
  exact?: boolean;
}

// アプリケーションのすべてのルートを定義
export const ROUTES = {
  // 基本ルート - オーダー一覧ページ
  DASHBOARD: {
    path: "/",
    component: DashboardPage,
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,

  // 認証
  STORE_LOGIN: {
    path: "/store-login",
    component: StoreLoginPage,
    exact: true,
  } as RouteDefinition,
};

// タイプセーフなナビゲーション用ヘルパー関数
export const getPath = {
  // 静的ルート
  dashboard: () => ROUTES.DASHBOARD.path,
};

// ルート設定の配列（App.tsxで使用）
export const routeConfig = Object.values(ROUTES);
