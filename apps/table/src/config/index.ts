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
  // テーブル番号（LocalStorageから取得、なければデフォルト値）
  TABLE_NUMBER: (() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accorto_table_number') || 
             import.meta.env.VITE_TABLE_NUMBER || "1";
    }
    return import.meta.env.VITE_TABLE_NUMBER || "1";
  })(),
  // 店舗ID（LocalStorageから取得、なければデフォルト値）
  STORE_ID: (() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accorto_store_id') || 
             import.meta.env.VITE_STORE_ID || "1";
    }
    return import.meta.env.VITE_STORE_ID || "1";
  })(),
};

// 開発環境かどうかを示すフラグ
export const IS_DEV = import.meta.env.DEV;

// 画像URLを完全なURLに変換するヘルパー関数
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // 既にフルURLの場合はそのまま返す
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 相対パスの場合はAPIベースURLと結合
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', ''); // /apiを除去
  return `${baseUrl}${imagePath}`;
};

// 定数をまとめたオブジェクト
export default {
  API: API_CONFIG,
  BUSINESS: BUSINESS_CONFIG,
  UI: UI_CONFIG,
  IS_DEV,
};
