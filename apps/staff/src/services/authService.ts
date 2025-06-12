import { API_CONFIG } from '../config';

export interface StaffLoginData {
  storeCode: string;
  loginId: string;
  password: string;
}

export interface Staff {
  id: number;
  name: string;
  loginId: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface Store {
  id: number;
  name: string;
  address?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    staff: Staff;
    store: Store;
    token: string;
  };
  error?: string;
}

// ローカルストレージキー
const TOKEN_KEY = 'staff_auth_token';
const STAFF_KEY = 'current_staff';
const STORE_KEY = 'current_store';

/**
 * スタッフログイン
 */
export const login = async (loginData: StaffLoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/staff-auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginData),
  });

  const data = await response.json();

  if (data.success && data.data) {
    // 認証情報をローカルストレージに保存
    localStorage.setItem(TOKEN_KEY, data.data.token);
    localStorage.setItem(STAFF_KEY, JSON.stringify(data.data.staff));
    localStorage.setItem(STORE_KEY, JSON.stringify(data.data.store));
  }

  return data;
};

/**
 * スタッフログアウト
 */
export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_CONFIG.BASE_URL}/staff-auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // ローカルストレージから認証情報を削除
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STAFF_KEY);
    localStorage.removeItem(STORE_KEY);
  }
};

/**
 * トークン検証
 */
export const verifyToken = async (): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/staff-auth/verify`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      // 最新のスタッフ・店舗情報を更新
      localStorage.setItem(STAFF_KEY, JSON.stringify(data.data.staff));
      localStorage.setItem(STORE_KEY, JSON.stringify(data.data.store));
      return true;
    } else {
      // トークンが無効な場合はクリア
      await logout();
      return false;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    await logout();
    return false;
  }
};

/**
 * 認証状態チェック
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const staff = getCurrentStaff();
  const store = getCurrentStore();
  return !!(token && staff && store);
};

/**
 * 認証トークン取得
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 認証ヘッダー取得
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 現在のスタッフ情報取得
 */
export const getCurrentStaff = (): Staff | null => {
  const staffData = localStorage.getItem(STAFF_KEY);
  return staffData ? JSON.parse(staffData) : null;
};

/**
 * 現在の店舗情報取得
 */
export const getCurrentStore = (): Store | null => {
  const storeData = localStorage.getItem(STORE_KEY);
  return storeData ? JSON.parse(storeData) : null;
};

/**
 * 権限チェック
 */
export const hasRole = (role: string): boolean => {
  const staff = getCurrentStaff();
  return staff?.role === role;
};

/**
 * 管理者権限チェック
 */
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

/**
 * マネージャー権限チェック
 */
export const isManager = (): boolean => {
  return hasRole('manager') || isAdmin();
};