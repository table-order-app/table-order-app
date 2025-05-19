// アプリケーションのルート定義
import { ComponentType } from "react";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MenuPage from "./pages/menu/MenuPage";
import StaffPage from "./pages/staff/StaffPage";
import TablesPage from "./pages/tables/TablesPage";
import MainLayout from "./layouts/MainLayout";

// ルート定義の型
interface RouteDefinition {
  path: string;
  component: ComponentType;
  layout?: ComponentType<{ children: React.ReactNode }>;
  exact?: boolean;
}

// アプリケーションのすべてのルートを定義
export const ROUTES = {
  // 基本ルート
  DASHBOARD: {
    path: "/",
    component: DashboardPage,
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,

  MENU: {
    path: "/menu",
    component: MenuPage,
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,

  // スタッフ管理ページ
  STAFF: {
    path: "/staff",
    component: StaffPage,
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,

  // テーブル設定ページ
  TABLES: {
    path: "/tables",
    component: TablesPage,
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,

  REPORTS: {
    path: "/reports",
    component: DashboardPage, // 一時的にDashboardPageを使用
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,

  SETTINGS: {
    path: "/settings",
    component: DashboardPage, // 一時的にDashboardPageを使用
    layout: MainLayout,
    exact: true,
  } as RouteDefinition,
};

// タイプセーフなナビゲーション用ヘルパー関数
export const getPath = {
  // 静的ルート
  dashboard: () => ROUTES.DASHBOARD.path,
  menu: () => ROUTES.MENU.path,
  staff: () => ROUTES.STAFF.path,
  tables: () => ROUTES.TABLES.path,
  reports: () => ROUTES.REPORTS.path,
  settings: () => ROUTES.SETTINGS.path,
};

// ルート設定の配列（App.tsxで使用）
export const routeConfig = Object.values(ROUTES);
