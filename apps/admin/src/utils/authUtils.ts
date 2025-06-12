/**
 * 認証関連のユーティリティ関数
 */

/**
 * ログイン状態をチェックする
 */
export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const storeId = localStorage.getItem('accorto_admin_store_id');
  const loginTime = localStorage.getItem('accorto_admin_login_time');
  
  return !!(storeId && loginTime);
};

/**
 * ログイン情報を取得する
 */
export const getLoginInfo = () => {
  if (typeof window === 'undefined') return null;
  
  const storeId = localStorage.getItem('accorto_admin_store_id');
  const loginTime = localStorage.getItem('accorto_admin_login_time');
  
  if (!storeId || !loginTime) return null;
  
  return {
    storeId,
    loginTime: new Date(loginTime)
  };
};

/**
 * ログアウトする（LocalStorageをクリア）
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accorto_admin_store_id');
  localStorage.removeItem('accorto_admin_login_time');
};

/**
 * 認証が不要なパスかどうかをチェック
 */
export const isPublicPath = (pathname: string): boolean => {
  const publicPaths = ['/store-login'];
  return publicPaths.includes(pathname);
};