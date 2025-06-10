import React, { useEffect, useState } from 'react';
import { initializeAppConfig, getCurrentConfig, debugCurrentConfig, AppConfig } from '../services/configService';
import { getCurrentDeviceId } from '../services/deviceService';
import LoadingSpinner from './LoadingSpinner';

interface AppInitializerProps {
  children: React.ReactNode;
  onConfigReady: (config: AppConfig) => void;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children, onConfigReady }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('アプリケーションを初期化中...');
        
        const result = await initializeAppConfig();
        
        if (result.config) {
          onConfigReady(result.config);
          setIsDeviceRegistered(result.success);
          
          // デバッグ情報を出力
          debugCurrentConfig();
          
          if (!result.success) {
            setError(result.error || 'デバイスが登録されていません');
          }
        } else {
          throw new Error('設定の初期化に失敗しました');
        }
        
      } catch (err) {
        console.error('アプリ初期化エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [onConfigReady]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">アプリケーションを初期化中...</p>
        </div>
      </div>
    );
  }

  if (error && !isDeviceRegistered) {
    const deviceId = getCurrentDeviceId();
    
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">デバイス未登録</h1>
          <p className="text-gray-600 mb-4">
            このデバイスは店舗システムに登録されていません。
          </p>
          
          {deviceId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">デバイスID</p>
              <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {deviceId}
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 mb-6">
            管理者にデバイスIDを伝えて、店舗とテーブルの設定を依頼してください。
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            再読み込み
          </button>
          
          {/* 開発用：デバイス設定をリセット */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full mt-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm"
            >
              [開発用] デバイスをリセット
            </button>
          )}
        </div>
      </div>
    );
  }

  // 設定完了、通常のアプリを表示
  return <>{children}</>;
};

export default AppInitializer;