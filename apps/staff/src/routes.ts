// アプリケーションのルート定義
import { ComponentType } from "react";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import TableDetailPage from "./pages/table/TableDetailPage";
import LoginPage from "./pages/auth/LoginPage";

// ルート定義の型
interface RouteDefinition {
  path: string;
  component: ComponentType;
  layout?: ComponentType<{ children: React.ReactNode }>;
  exact?: boolean;
}

// アプリケーションのすべてのルートを定義
export const ROUTES = {
  // 基本ルート - ダッシュボード
  DASHBOARD: {
    path: "/dashboard",
    component: DashboardPage,
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,

  // テーブル詳細ページ
  TABLE_DETAIL: {
    path: "/table/:tableId",
    component: TableDetailPage,
    layout: MainLayout,
  } as RouteDefinition,

  // 認証
  LOGIN: {
    path: "/login",
    component: LoginPage,
    exact: true,
  } as RouteDefinition,
};

// タイプセーフなナビゲーション用ヘルパー関数
export const getPath = {
  // 静的ルート
  dashboard: () => ROUTES.DASHBOARD.path,
  login: () => ROUTES.LOGIN.path,

  // 動的ルート
  tableDetail: (tableId: string) =>
    ROUTES.TABLE_DETAIL.path.replace(":tableId", tableId),
};

// ルート設定の配列（App.tsxで使用）
export const routeConfig = Object.values(ROUTES);
