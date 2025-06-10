import { API_CONFIG } from '../config';

export interface DeviceConfig {
  storeId: number;
  tableId: number;
  tableName: number;
  storeName: string;
  deviceName?: string;
}

export interface DeviceConfigResponse {
  success: boolean;
  data?: DeviceConfig;
  error?: string;
}

/**
 * デバイスIDを生成または取得する
 */
export const getOrCreateDeviceId = (): string => {
  const DEVICE_ID_KEY = 'table_device_id';
  
  // 既存のデバイスIDを確認
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // 新しいデバイスIDを生成
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('新しいデバイスIDを生成しました:', deviceId);
  }
  
  return deviceId;
};

/**
 * デバイス設定をサーバーから取得する
 */
export const fetchDeviceConfig = async (deviceId: string): Promise<DeviceConfigResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/device/config/${deviceId}`);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'デバイス設定の取得に失敗しました'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Device config fetch error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
};

/**
 * デバイス設定を初期化する
 * アプリ起動時に呼び出される
 */
export const initializeDeviceConfig = async (): Promise<DeviceConfigResponse> => {
  const deviceId = getOrCreateDeviceId();
  
  console.log('デバイス設定を初期化中...', { deviceId });
  
  const result = await fetchDeviceConfig(deviceId);
  
  if (result.success && result.data) {
    // 設定を localStorage に保存（オフライン時のフォールバック用）
    localStorage.setItem('device_config', JSON.stringify(result.data));
    console.log('デバイス設定を取得しました:', result.data);
  } else {
    // サーバーから取得できない場合、キャッシュされた設定を確認
    const cachedConfig = localStorage.getItem('device_config');
    if (cachedConfig) {
      try {
        const parsedConfig = JSON.parse(cachedConfig);
        console.log('キャッシュされた設定を使用します:', parsedConfig);
        return {
          success: true,
          data: parsedConfig
        };
      } catch (e) {
        console.error('キャッシュされた設定の解析に失敗:', e);
      }
    }
  }
  
  return result;
};

/**
 * 現在のデバイスIDを取得する
 */
export const getCurrentDeviceId = (): string | null => {
  return localStorage.getItem('table_device_id');
};

/**
 * デバイス設定をリセットする（開発用）
 */
export const resetDeviceConfig = (): void => {
  localStorage.removeItem('table_device_id');
  localStorage.removeItem('device_config');
  console.log('デバイス設定をリセットしました');
};

/**
 * デバイス登録状態を確認する
 */
export const isDeviceRegistered = async (): Promise<boolean> => {
  const deviceId = getCurrentDeviceId();
  if (!deviceId) return false;
  
  const result = await fetchDeviceConfig(deviceId);
  return result.success;
};

/**
 * キャッシュされた設定を取得する
 */
export const getCachedDeviceConfig = (): DeviceConfig | null => {
  try {
    const cached = localStorage.getItem('device_config');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.error('キャッシュ設定の取得に失敗:', e);
    return null;
  }
};