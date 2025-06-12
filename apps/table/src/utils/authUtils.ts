/**
 * 認証関連のユーティリティ関数
 */

/**
 * ログイン状態をチェックする
 */
export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const storeCode = localStorage.getItem('accorto_store_code');
  const tableNumber = localStorage.getItem('accorto_table_number');
  const loginTime = localStorage.getItem('accorto_login_time');
  
  return !!(storeCode && tableNumber && loginTime);
};

/**
 * ログイン情報を取得する
 */
export const getLoginInfo = () => {
  if (typeof window === 'undefined') return null;
  
  const storeCode = localStorage.getItem('accorto_store_code');
  const tableNumber = localStorage.getItem('accorto_table_number');
  const loginTime = localStorage.getItem('accorto_login_time');
  
  if (!storeCode || !tableNumber || !loginTime) return null;
  
  return {
    storeCode,
    tableNumber,
    loginTime: new Date(loginTime)
  };
};

/**
 * ログアウトする（LocalStorageをクリア）
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accorto_store_code');
  localStorage.removeItem('accorto_table_number');
  localStorage.removeItem('accorto_login_time');
};

/**
 * 認証が不要なパスかどうかをチェック
 */
export const isPublicPath = (pathname: string): boolean => {
  const publicPaths = ['/store-login'];
  return publicPaths.includes(pathname);
};