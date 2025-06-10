import { initializeDeviceConfig, getCachedDeviceConfig, DeviceConfig } from './deviceService';
import { UI_CONFIG as STATIC_CONFIG } from '../config';

export interface AppConfig {
  // デバイス設定（動的）
  storeId: number;
  tableId: number;
  tableName: number;
  storeName: string;
  deviceName?: string;
  
  // 静的設定
  apiBaseUrl: string;
  tableNumber: string; // 表示用
  primaryColor: string;
  primaryColorHover: string;
}

let currentConfig: AppConfig | null = null;

/**
 * アプリケーション設定を初期化する
 */
export const initializeAppConfig = async (): Promise<{ success: boolean; config?: AppConfig; error?: string }> => {
  try {
    // デバイス設定を取得
    const deviceResult = await initializeDeviceConfig();
    
    if (!deviceResult.success) {
      // デバイス設定が取得できない場合は、フォールバック設定を使用
      const fallbackConfig = createFallbackConfig();
      currentConfig = fallbackConfig;
      
      return {
        success: false,
        config: fallbackConfig,
        error: `デバイス未登録: ${deviceResult.error}`
      };
    }
    
    if (!deviceResult.data) {
      throw new Error('デバイス設定データが空です');
    }
    
    // 統合設定を作成
    const config = createAppConfig(deviceResult.data);
    currentConfig = config;
    
    return {
      success: true,
      config
    };
    
  } catch (error) {
    console.error('設定初期化エラー:', error);
    
    const fallbackConfig = createFallbackConfig();
    currentConfig = fallbackConfig;
    
    return {
      success: false,
      config: fallbackConfig,
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
};

/**
 * デバイス設定から統合設定を作成する
 */
const createAppConfig = (deviceConfig: DeviceConfig): AppConfig => {
  return {
    // デバイス設定
    storeId: deviceConfig.storeId,
    tableId: deviceConfig.tableId,
    tableName: deviceConfig.tableName,
    storeName: deviceConfig.storeName,
    deviceName: deviceConfig.deviceName,
    
    // 静的設定
    apiBaseUrl: STATIC_CONFIG.API_BASE_URL,
    tableNumber: deviceConfig.tableName.toString(),
    primaryColor: STATIC_CONFIG.PRIMARY_COLOR,
    primaryColorHover: STATIC_CONFIG.PRIMARY_COLOR_HOVER,
  };
};

/**
 * フォールバック設定を作成する（デバイス未登録時）
 */
const createFallbackConfig = (): AppConfig => {
  // キャッシュされた設定があるか確認
  const cachedDevice = getCachedDeviceConfig();
  
  if (cachedDevice) {
    return createAppConfig(cachedDevice);
  }
  
  // 完全なフォールバック（従来の静的設定）
  return {
    storeId: 1, // デフォルト店舗
    tableId: 1, // デフォルトテーブルID
    tableName: parseInt(STATIC_CONFIG.TABLE_NUMBER) || 1,
    storeName: 'Accorto レストラン',
    deviceName: 'テスト端末',
    
    apiBaseUrl: STATIC_CONFIG.API_BASE_URL,
    tableNumber: STATIC_CONFIG.TABLE_NUMBER,
    primaryColor: STATIC_CONFIG.PRIMARY_COLOR,
    primaryColorHover: STATIC_CONFIG.PRIMARY_COLOR_HOVER,
  };
};

/**
 * 現在の設定を取得する
 */
export const getCurrentConfig = (): AppConfig => {
  if (!currentConfig) {
    throw new Error('設定が初期化されていません。initializeAppConfig() を先に呼び出してください。');
  }
  return currentConfig;
};

/**
 * 設定をリロードする
 */
export const reloadAppConfig = async (): Promise<{ success: boolean; config?: AppConfig; error?: string }> => {
  return await initializeAppConfig();
};

/**
 * デバイス登録状態を確認する
 */
export const isDeviceRegistered = (): boolean => {
  return currentConfig ? (currentConfig.storeId > 0 && currentConfig.tableId > 0) : false;
};

/**
 * デバッグ用：現在の設定をコンソールに出力
 */
export const debugCurrentConfig = (): void => {
  console.log('=== 現在のアプリ設定 ===');
  console.log('設定:', currentConfig);
  console.log('デバイス登録状態:', isDeviceRegistered());
  console.log('========================');
};