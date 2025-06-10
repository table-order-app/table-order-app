import React, { useState, useEffect } from 'react';
import { Device, getDevices, deleteDevice } from '../../services/deviceService';
import { getStores } from '../../services/menuService';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import DeviceForm from './DeviceForm';

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stores, setStores] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  
  // モーダル関連
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  
  // 削除確認ダイアログ
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    device: Device | null;
  }>({ isOpen: false, device: null });

  // 初期データ取得
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 店舗変更時にデバイス一覧を再取得
  useEffect(() => {
    fetchDevices();
  }, [selectedStoreId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storesResult] = await Promise.all([
        getStores()
      ]);

      if (storesResult.success && storesResult.data) {
        setStores(storesResult.data);
        // 最初の店舗を選択
        if (storesResult.data.length > 0) {
          setSelectedStoreId(storesResult.data[0].id);
        }
      }
    } catch (err) {
      setError('初期データの取得に失敗しました');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const result = await getDevices(selectedStoreId);
      if (result.success && result.data) {
        setDevices(result.data);
        setError(null);
      } else {
        setError(result.error || 'デバイス一覧の取得に失敗しました');
      }
    } catch (err) {
      setError('デバイス一覧の取得に失敗しました');
      console.error('Error fetching devices:', err);
    }
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setIsFormModalOpen(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingDevice(null);
    fetchDevices();
  };

  const handleDeleteClick = (device: Device) => {
    setDeleteConfirm({ isOpen: true, device });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.device) return;

    try {
      const result = await deleteDevice(deleteConfirm.device.id);
      if (result.success) {
        fetchDevices();
        setDeleteConfirm({ isOpen: false, device: null });
      } else {
        setError(result.error || 'デバイスの削除に失敗しました');
      }
    } catch (err) {
      setError('デバイスの削除に失敗しました');
      console.error('Error deleting device:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      available: { text: '利用可能', class: 'bg-green-100 text-green-800' },
      occupied: { text: '使用中', class: 'bg-yellow-100 text-yellow-800' },
      reserved: { text: '予約済', class: 'bg-blue-100 text-blue-800' },
      maintenance: { text: 'メンテナンス', class: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">デバイス管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            テーブル端末の登録と設定を管理します
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          {/* 店舗選択 */}
          <select
            value={selectedStoreId || ''}
            onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全店舗</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          
          {/* 新規登録ボタン */}
          <button
            onClick={handleAddDevice}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            デバイス追加
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* デバイス一覧テーブル */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  デバイス情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  店舗・テーブル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日時
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">登録されたデバイスがありません</p>
                    </div>
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {device.name || 'デバイス名なし'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          ID: {device.deviceId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{device.store.name}</div>
                        <div className="text-sm text-gray-500">
                          テーブル {device.table.number} ({device.table.capacity}名席)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(device.table.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(device.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditDevice(device)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteClick(device)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* デバイス登録・編集モーダル */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)}
        title={editingDevice ? 'デバイス設定編集' : 'デバイス登録'}
      >
        <DeviceForm
          device={editingDevice}
          stores={stores}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="デバイス削除"
        message={`デバイス「${deleteConfirm.device?.name || deleteConfirm.device?.deviceId}」を削除しますか？この操作は取り消せません。`}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, device: null })}
      />
    </div>
  );
};

export default DevicesPage;