// アプリケーションのルート定義

export const routes = {
  // 基本ルート
  home: "/",
  categories: "/categories",

  // パラメータを含むルート (関数として定義)
  menuList: (categoryId: string | number = ":categoryId") =>
    `/menus/${categoryId}`,
  menuDetail: (menuId: string | number = ":menuId") => `/menu-detail/${menuId}`,
};

// タイプセーフなナビゲーション用ヘルパー関数
export const getPath = {
  // 静的ルート
  home: () => routes.home,
  categories: () => routes.categories,

  // 動的ルート
  menuList: (categoryId: number) => routes.menuList(categoryId),
  menuDetail: (menuId: number) => routes.menuDetail(menuId),
};

// ルートパターン (React Router のルートマッチングで使用)
export const routePatterns = {
  home: routes.home,
  categories: routes.categories,
  menuList: routes.menuList(), // パラメータプレースホルダーを含むパターン
  menuDetail: routes.menuDetail(), // パラメータプレースホルダーを含むパターン
};
