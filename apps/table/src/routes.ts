// アプリケーションのルート定義
import { ComponentType } from "react";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import MenuListPage from "./pages/MenuListPage";
import MenuDetailPage from "./pages/MenuDetailPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import StoreLoginPage from "./pages/StoreLoginPage";

// ルート定義の型
interface RouteDefinition {
  path: string;
  component: ComponentType;
  exact?: boolean;
}

// アプリケーションのすべてのルートを定義
export const ROUTES = {
  // 店舗ログイン
  STORE_LOGIN: {
    path: "/store-login",
    component: StoreLoginPage,
    exact: true,
  } as RouteDefinition,

  // 基本ルート
  HOME: {
    path: "/",
    component: HomePage,
    exact: true,
  } as RouteDefinition,

  CATEGORIES: {
    path: "/categories",
    component: CategoryPage,
    exact: true,
  } as RouteDefinition,

  // パラメータを含むルート
  MENU_LIST: {
    path: "/menus/:categoryId",
    component: MenuListPage,
    exact: true,
  } as RouteDefinition,

  MENU_DETAIL: {
    path: "/menu-detail/:menuId",
    component: MenuDetailPage,
    exact: true,
  } as RouteDefinition,

  ORDER_SUCCESS: {
    path: "/order-success",
    component: OrderSuccessPage,
    exact: true,
  } as RouteDefinition,

  ORDER_CONFIRMATION: {
    path: "/order-confirmation",
    component: OrderConfirmationPage,
    exact: true,
  } as RouteDefinition,
};

// タイプセーフなナビゲーション用ヘルパー関数
export const getPath = {
  // 静的ルート
  storeLogin: () => ROUTES.STORE_LOGIN.path,
  home: () => ROUTES.HOME.path,
  categories: () => ROUTES.CATEGORIES.path,
  orderSuccess: () => ROUTES.ORDER_SUCCESS.path,
  orderConfirmation: () => ROUTES.ORDER_CONFIRMATION.path,

  // 動的ルート
  menuList: (categoryId: number) => `/menus/${categoryId}`,
  menuDetail: (menuId: number) => `/menu-detail/${menuId}`,
};

// ルート設定の配列（App.tsxで使用）
export const routeConfig = Object.values(ROUTES);
