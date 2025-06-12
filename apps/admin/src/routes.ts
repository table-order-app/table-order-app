// アプリケーションのルート定義
import DashboardPage from "./pages/dashboard/DashboardPage";
import MenuPage from "./pages/menu/MenuPage";
import StaffPage from "./pages/staff/StaffPage";
import TablesPage from "./pages/tables/TablesPage";
import StoresPage from "./pages/stores/StoresPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import StoreLoginPage from "./pages/StoreLoginPage";
import MainLayout from "./layouts/MainLayout";

// ルート定義の型
interface RouteDefinition {
  path: string;
  component: () => JSX.Element;
  layout?: ({ children }: { children: JSX.Element }) => JSX.Element;
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

  // 店舗管理ページ
  STORES: {
    path: "/stores",
    component: StoresPage,
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

  // 認証
  LOGIN: {
    path: "/login",
    component: LoginPage,
    exact: true,
  } as RouteDefinition,

  SIGNUP: {
    path: "/signup",
    component: SignupPage,
    exact: true,
  } as RouteDefinition,

  // 旧認証（後で削除予定）
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
  menu: () => ROUTES.MENU.path,
  staff: () => ROUTES.STAFF.path,
  tables: () => ROUTES.TABLES.path,
  stores: () => ROUTES.STORES.path,
  reports: () => ROUTES.REPORTS.path,
  settings: () => ROUTES.SETTINGS.path,
  login: () => ROUTES.LOGIN.path,
  signup: () => ROUTES.SIGNUP.path,
};

// ルート設定の配列（App.tsxで使用）
export const routeConfig = Object.values(ROUTES);
