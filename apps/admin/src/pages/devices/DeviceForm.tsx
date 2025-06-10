import React, { useState, useEffect } from 'react';
import { Device, createDevice, updateDevice } from '../../services/deviceService';
import { getTables } from '../../services/tableService';

interface DeviceFormProps {
  device?: Device | null;
  stores: Array<{ id: number; name: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Table {
  id: number;
  number: number;
  capacity: number;
  area: string;
  status: string;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ device, stores, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    deviceId: device?.deviceId || '',
    storeId: device?.storeId || (stores.length > 0 ? stores[0].id : 0),
    tableId: device?.tableId || 0,
    name: device?.name || '',
  });

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingTables, setFetchingTables] = useState(false);

  // 店舗変更時にテーブル一覧を取得
  useEffect(() => {
    if (formData.storeId) {
      fetchTables(formData.storeId);
    }
  }, [formData.storeId]);

  const fetchTables = async (storeId: number) => {
    try {
      setFetchingTables(true);
      const result = await getTables(storeId);
      
      if (result.success && result.data) {
        setTables(result.data);
        
        // 編集モードでない場合、最初のテーブルを選択
        if (!device && result.data.length > 0) {
          setFormData(prev => ({ ...prev, tableId: result.data[0].id }));
        }
      } else {
        setError(result.error || 'テーブル一覧の取得に失敗しました');
        setTables([]);
      }
    } catch (err) {
      setError('テーブル一覧の取得に失敗しました');
      setTables([]);
      console.error('Error fetching tables:', err);
    } finally {
      setFetchingTables(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'storeId' || name === 'tableId' ? Number(value) : value
    }));
  };

  const validateForm = () => {
    if (!formData.deviceId.trim()) {
      setError('デバイスIDを入力してください');
      return false;
    }
    
    if (!formData.storeId) {
      setError('店舗を選択してください');
      return false;
    }
    
    if (!formData.tableId) {
      setError('テーブルを選択してください');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      let result;
      if (device) {
        // 編集モード
        result = await updateDevice(device.id, {
          storeId: formData.storeId,
          tableId: formData.tableId,
          name: formData.name || undefined,
        });
      } else {
        // 新規登録モード
        result = await createDevice({
          deviceId: formData.deviceId,
          storeId: formData.storeId,
          tableId: formData.tableId,
          name: formData.name || undefined,
        });
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || '保存に失敗しました');
      }
    } catch (err) {
      setError('保存に失敗しました');
      console.error('Error saving device:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatus = (status: string) => {
    const statusMap = {
      available: '利用可能',
      occupied: '使用中',
      reserved: '予約済',
      maintenance: 'メンテナンス'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 利用可能なテーブル（使用中以外）をフィルタリング
  const availableTables = tables.filter(table => 
    table.status !== 'occupied' || (device && table.id === device.tableId)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* デバイスID */}
      <div>
        <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
          デバイスID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="deviceId"
          name="deviceId"
          value={formData.deviceId}
          onChange={handleInputChange}
          disabled={!!device} // 編集時は変更不可
          placeholder="例: abc123-def456-ghi789"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          required
        />
        {device && (
          <p className="mt-1 text-xs text-gray-500">
            ※ デバイスIDは編集できません
          </p>
        )}
      </div>

      {/* 店舗選択 */}
      <div>
        <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-2">
          店舗 <span className="text-red-500">*</span>
        </label>
        <select
          id="storeId"
          name="storeId"
          value={formData.storeId}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">店舗を選択</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* テーブル選択 */}
      <div>
        <label htmlFor="tableId" className="block text-sm font-medium text-gray-700 mb-2">
          テーブル <span className="text-red-500">*</span>
        </label>
        <select
          id="tableId"
          name="tableId"
          value={formData.tableId}
          onChange={handleInputChange}
          disabled={fetchingTables || availableTables.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          required
        >
          <option value="">テーブルを選択</option>
          {availableTables.map((table) => (
            <option key={table.id} value={table.id}>
              テーブル {table.number} ({table.capacity}名席, {table.area}) - {getTableStatus(table.status)}
            </option>
          ))}
        </select>
        {fetchingTables && (
          <p className="mt-1 text-xs text-gray-500">テーブル情報を取得中...</p>
        )}
        {!fetchingTables && availableTables.length === 0 && formData.storeId && (
          <p className="mt-1 text-xs text-red-500">利用可能なテーブルがありません</p>
        )}
      </div>

      {/* デバイス名 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          デバイス名（管理用）
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="例: カウンター席1号機"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          管理しやすい名前を付けてください（省略可）
        </p>
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading || availableTables.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              保存中...
            </div>
          ) : (
            device ? '更新' : '登録'
          )}
        </button>
      </div>
    </form>
  );
};

export default DeviceForm;