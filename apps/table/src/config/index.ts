/**
 * アプリケーション全体で使用する設定パラメータ
 */

// APIエンドポイント設定
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  TIMEOUT: 10000,
};

// ビジネスロジック設定
export const BUSINESS_CONFIG = {
  // カートの最大数量
  MAX_CART_QUANTITY: 10,
  // メニュー数量の最小値/最大値
  MIN_MENU_QUANTITY: 1,
  MAX_MENU_QUANTITY: 10,
  // 商品画像のデフォルトパス
  DEFAULT_MENU_IMAGE: "/assets/images/default-menu.png",
};

// UI設定
export const UI_CONFIG = {
  // カート開閉のアニメーション時間
  CART_ANIMATION_DURATION: 300,
  // 主要なテーマカラー（TailwindCSS用）
  PRIMARY_COLOR: "#e0815e",
  PRIMARY_COLOR_HOVER: "#d3704f",
  // テーブル番号（本番環境では動的に取得する）
  TABLE_NUMBER: import.meta.env.VITE_TABLE_NUMBER || "1",
};

// 開発環境かどうかを示すフラグ
export const IS_DEV = import.meta.env.DEV;

// 定数をまとめたオブジェクト
export default {
  API: API_CONFIG,
  BUSINESS: BUSINESS_CONFIG,
  UI: UI_CONFIG,
  IS_DEV,
};
