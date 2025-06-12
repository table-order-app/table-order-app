import { API_CONFIG } from '../config';
import { getAuthHeaders } from './authService';

export interface Store {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface UpdateStoreData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

/**
 * ログイン中の店舗情報を取得
 */
export const getCurrentStoreInfo = async (): Promise<Store> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || '店舗情報の取得に失敗しました');
  }
  
  return data.data.store;
};



/**
 * ログイン中の店舗情報を更新
 */
export const updateStore = async (id: number, storeData: UpdateStoreData): Promise<Store> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/admin/store`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(storeData),
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || '店舗の更新に失敗しました');
  }
  
  return data.data;
};

