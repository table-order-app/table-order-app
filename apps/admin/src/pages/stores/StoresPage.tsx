import { useState, useEffect } from 'react';
import { getCurrentStore } from '../../services/authService';
import { updateStore } from '../../services/storeService';

interface StoreData {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  address?: string;
  phone?: string;
}

interface BusinessHours {
  open: string;
  close: string;
}

const StoresPage = () => {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    address: '',
    phone: ''
  });

  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    open: '09:00',
    close: '17:00'
  });

  useEffect(() => {
    loadCurrentStore();
  }, []);

  const loadCurrentStore = async () => {
    try {
      setLoading(true);
      const currentStore = getCurrentStore();
      if (currentStore) {
        setStore(currentStore);
        setFormData({
          name: currentStore.name,
          ownerName: currentStore.ownerName,
          email: currentStore.email,
          address: currentStore.address || '',
          phone: currentStore.phone || ''
        });
      }
      
      // 営業時間をローカルストレージから復元
      const savedHours = localStorage.getItem('businessHours');
      if (savedHours) {
        setBusinessHours(JSON.parse(savedHours));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '店舗情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!store) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updateStore(store.id, {
        name: formData.name,
        address: formData.address,
        phone: formData.phone
      });
      
      // ローカルストレージの店舗情報も更新
      const updatedStore = { ...store, ...formData };
      localStorage.setItem('currentStore', JSON.stringify(updatedStore));
      setStore(updatedStore);
      
      setSuccess('店舗情報を更新しました');
      setIsEditing(false);
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '店舗情報の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (store) {
      setFormData({
        name: store.name,
        ownerName: store.ownerName,
        email: store.email,
        address: store.address || '',
        phone: store.phone || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleBusinessHoursChange = (field: 'open' | 'close', value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBusinessHours = () => {
    // ここで営業時間をサーバーに保存する処理を追加
    // 現在はローカルストレージに保存
    localStorage.setItem('businessHours', JSON.stringify(businessHours));
    setSuccess('営業時間を更新しました');
    setIsEditingHours(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCancelBusinessHours = () => {
    // ローカルストレージから営業時間を復元
    const saved = localStorage.getItem('businessHours');
    if (saved) {
      setBusinessHours(JSON.parse(saved));
    }
    setIsEditingHours(false);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">店舗設定</h1>
        {!isEditing && store && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            編集
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-500 hover:text-red-700"
          >
            閉じる
          </button>
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* 店舗情報表示/編集 */}
      {store && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 店舗名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                店舗名 <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2">{store.name}</p>
              )}
            </div>

            {/* オーナー名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                オーナー名
              </label>
              <p className="text-gray-900 py-2">{store.ownerName}</p>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">※オーナー名は変更できません</p>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <p className="text-gray-900 py-2">{store.email}</p>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">※メールアドレスは変更できません</p>
              )}
            </div>

            {/* 電話番号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="03-1234-5678"
                />
              ) : (
                <p className="text-gray-900 py-2">{store.phone || '未設定'}</p>
              )}
            </div>

            {/* 住所 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所
              </label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="東京都渋谷区..."
                />
              ) : (
                <p className="text-gray-900 py-2">{store.address || '未設定'}</p>
              )}
            </div>
          </div>

          {/* 編集時のボタン */}
          {isEditing && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                )}
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 営業時間設定 */}
      {store && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">営業時間設定</h2>
            {!isEditingHours && (
              <button
                onClick={() => setIsEditingHours(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                編集
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-20 text-sm font-medium text-gray-700">
                営業時間
              </div>
              
              {isEditingHours ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={businessHours.open}
                    onChange={(e) => handleBusinessHoursChange('open', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-gray-500">〜</span>
                  <input
                    type="time"
                    value={businessHours.close}
                    onChange={(e) => handleBusinessHoursChange('close', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    {businessHours.open} 〜 {businessHours.close}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 営業時間編集時のボタン */}
          {isEditingHours && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancelBusinessHours}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveBusinessHours}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                保存
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoresPage;