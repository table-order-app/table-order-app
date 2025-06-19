import { API_CONFIG } from '../config';

export interface Table {
  id: number;
  storeId: number;
  number: number;
  capacity: number;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableResponse {
  success: boolean;
  data?: Table;
  error?: string;
}

export const getTableByNumber = async (tableNumber: number): Promise<TableResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/table/number/${tableNumber}`);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'テーブル情報の取得に失敗しました'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching table by number:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
};

export interface TableValidationResponse {
  success: boolean;
  exists: boolean;
  error?: string;
  data?: {
    store: {
      id: number;
      name: string;
      storeCode: string;
    };
    table: {
      id: number;
      number: number;
      capacity: number;
    };
  };
}

export const validateTable = async (storeCode: string, tableNumber: number): Promise<TableValidationResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/table/validate/${storeCode}/${tableNumber}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error validating table:', error);
    return {
      success: false,
      exists: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
};