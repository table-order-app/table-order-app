import { API_CONFIG } from '../config';

export interface Device {
  id: string;
  deviceId: string;
  storeId: number;
  tableId: number;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  store: {
    id: number;
    name: string;
  };
  table: {
    id: number;
    number: number;
    capacity: number;
    area: string;
    status: string;
  };
}

export interface CreateDeviceRequest {
  deviceId: string;
  storeId: number;
  tableId: number;
  name?: string;
}

export interface UpdateDeviceRequest {
  storeId?: number;
  tableId?: number;
  name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * デバイス一覧を取得
 */
export const getDevices = async (storeId?: number): Promise<ApiResponse<Device[]>> => {
  try {
    const url = new URL(`${API_CONFIG.BASE_URL}/device`);
    if (storeId) {
      url.searchParams.append('storeId', storeId.toString());
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'デバイス一覧の取得に失敗しました'
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
};

/**
 * デバイスを登録
 */
export const createDevice = async (device: CreateDeviceRequest): Promise<ApiResponse<Device>> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(device),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'デバイスの登録に失敗しました'
      };
    }

    return data;
  } catch (error) {
    console.error('Error creating device:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
};

/**
 * デバイス設定を更新
 */
export const updateDevice = async (deviceId: string, updates: UpdateDeviceRequest): Promise<ApiResponse<Device>> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/device/${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'デバイス設定の更新に失敗しました'
      };
    }

    return data;
  } catch (error) {
    console.error('Error updating device:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
};

/**
 * デバイスを削除
 */
export const deleteDevice = async (deviceId: string): Promise<ApiResponse<Device>> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/device/${deviceId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'デバイスの削除に失敗しました'
      };
    }

    return data;
  } catch (error) {
    console.error('Error deleting device:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
};