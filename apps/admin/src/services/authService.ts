import { API_CONFIG } from '../config';

export interface Store {
  id: number;
  storeCode?: string;
  name: string;
  ownerName: string;
  email: string;
  address?: string;
  phone?: string;
}

export interface AuthResponse {
  store: Store;
  token: string;
}

export interface SignupData {
  name: string;
  ownerName: string;
  email: string;
  password: string;
  address?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const TOKEN_KEY = 'accorto_auth_token';
const STORE_KEY = 'accorto_store_data';

/**
 * 店舗アカウント登録
 */
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '店舗登録に失敗しました');
  }
  
  // トークンとストア情報を保存
  localStorage.setItem(TOKEN_KEY, result.data.token);
  localStorage.setItem(STORE_KEY, JSON.stringify(result.data.store));
  
  return result.data;
};

/**
 * 店舗ログイン
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'ログインに失敗しました');
  }
  
  // トークンとストア情報を保存
  localStorage.setItem(TOKEN_KEY, result.data.token);
  localStorage.setItem(STORE_KEY, JSON.stringify(result.data.store));
  
  return result.data;
};

/**
 * ログアウト
 */
export const logout = async (): Promise<void> => {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // ローカルストレージからトークンとストア情報を削除
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem('accorto_admin_store_id');
    localStorage.removeItem('accorto_admin_login_time');
  }
};

/**
 * トークン検証
 */
export const verifyToken = async (): Promise<Store | null> => {
  try {
    const token = getToken();
    if (!token) return null;
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const result = await response.json();
    
    if (!result.success) {
      // トークンが無効な場合はクリア
      logout();
      return null;
    }
    
    // ストア情報を更新
    localStorage.setItem(STORE_KEY, JSON.stringify(result.data.store));
    
    return result.data.store;
  } catch (error) {
    console.error('Token verification error:', error);
    logout();
    return null;
  }
};

/**
 * 現在のトークンを取得
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 認証ヘッダーを取得
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 現在のストア情報を取得
 */
export const getCurrentStore = (): Store | null => {
  if (typeof window === 'undefined') return null;
  
  const storeData = localStorage.getItem(STORE_KEY);
  if (!storeData) return null;
  
  try {
    return JSON.parse(storeData);
  } catch (error) {
    console.error('Error parsing store data:', error);
    return null;
  }
};

/**
 * ログイン状態をチェック
 */
export const isAuthenticated = (): boolean => {
  return !!(getToken() && getCurrentStore());
};

/**
 * 店舗コードを生成
 */
export const generateStoreCode = async (): Promise<Store> => {
  const store = getCurrentStore();
  if (!store) {
    throw new Error('店舗情報が取得できません');
  }

  const token = getToken();
  if (!token) {
    throw new Error('認証トークンが見つかりません');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}/store/${store.id}/generate-code`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '店舗コードの生成に失敗しました');
  }

  // ローカルストレージの店舗情報を更新
  localStorage.setItem(STORE_KEY, JSON.stringify(result.data));

  return result.data;
};

