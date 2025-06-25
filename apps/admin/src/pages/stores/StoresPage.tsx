import { useState, useEffect } from 'react';
import { getCurrentStore } from '../../services/authService';
import { updateStore } from '../../services/storeService';
import { 
  getBusinessHours, 
  updateBusinessHours, 
  formatBusinessHours,
  validateTimeInput,
  isNextDayOperation,
  normalizeTimeDisplay,
  BusinessHours,
  BusinessHoursInput 
} from '../../services/businessHoursService';

interface StoreData {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  address?: string;
  phone?: string;
}

// BusinessHours型はserviceからインポートされるので削除

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

  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [businessHoursInput, setBusinessHoursInput] = useState<BusinessHoursInput>({
    openTime: '09:00',
    closeTime: '17:00'
  });
  const [businessHoursLoading, setBusinessHoursLoading] = useState(false);

  useEffect(() => {
    loadCurrentStore();
    loadBusinessHours();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : '店舗情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessHours = async () => {
    try {
      setBusinessHoursLoading(true);
      const hours = await getBusinessHours();
      setBusinessHours(hours);
      setBusinessHoursInput({
        openTime: hours.openTime,
        closeTime: hours.closeTime
      });
    } catch (err) {
      console.warn('営業時間の取得に失敗しました:', err);
      // エラーの場合はデフォルト値を使用
    } finally {
      setBusinessHoursLoading(false);
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

  const handleBusinessHoursInputChange = (field: 'openTime' | 'closeTime', value: string) => {
    if (!validateTimeInput(value)) {
      return; // 無効な時刻は入力させない
    }
    
    setBusinessHoursInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBusinessHours = async () => {
    try {
      setBusinessHoursLoading(true);
      setError(null);
      
      // バリデーション
      if (!validateTimeInput(businessHoursInput.openTime) || !validateTimeInput(businessHoursInput.closeTime)) {
        setError('営業時間の形式が正しくありません（HH:MM形式、26:00まで可能）');
        return;
      }
      
      // サーバーに営業時間を保存
      const updatedHours = await updateBusinessHours(businessHoursInput);
      setBusinessHours(updatedHours);
      
      setSuccess('営業時間を更新しました。会計日の計算も自動で調整されます。');
      setIsEditingHours(false);
      
      // 成功メッセージを5秒後に消す
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '営業時間の更新に失敗しました');
    } finally {
      setBusinessHoursLoading(false);
    }
  };

  const handleCancelBusinessHours = () => {
    // 元の営業時間に戻す
    if (businessHours) {
      setBusinessHoursInput({
        openTime: businessHours.openTime,
        closeTime: businessHours.closeTime
      });
    }
    setIsEditingHours(false);
    setError(null);
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
            <div>
              <h2 className="text-lg font-medium text-gray-900">営業時間設定</h2>
              <p className="text-sm text-gray-500 mt-1">
                営業時間を設定すると、会計日の計算が自動で調整されます
              </p>
            </div>
            {!isEditingHours && !businessHoursLoading && (
              <button
                onClick={() => setIsEditingHours(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                編集
              </button>
            )}
          </div>

          {businessHoursLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-sm text-gray-600">営業時間を読み込み中...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 営業時間表示/編集 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    営業時間
                  </div>
                  {businessHours?.isNextDay && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      跨日営業
                    </span>
                  )}
                </div>
                
                {isEditingHours ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">営業開始</label>
                        <input
                          type="text"
                          value={businessHoursInput.openTime}
                          onChange={(e) => handleBusinessHoursInputChange('openTime', e.target.value)}
                          placeholder="17:00"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <span className="text-gray-500 mt-6">〜</span>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">営業終了</label>
                        <input
                          type="text"
                          value={businessHoursInput.closeTime}
                          onChange={(e) => handleBusinessHoursInputChange('closeTime', e.target.value)}
                          placeholder="26:00"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    {/* プレビュー表示 */}
                    {isNextDayOperation(businessHoursInput.openTime, businessHoursInput.closeTime) && (
                      <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                        <strong>跨日営業:</strong> {normalizeTimeDisplay(businessHoursInput.openTime)} 〜 {normalizeTimeDisplay(businessHoursInput.closeTime)}
                        <br />
                        例: 6/12 {businessHoursInput.openTime} ～ 6/13 {businessHoursInput.closeTime.replace(/^([0-2][0-6]):/, (_, h) => (parseInt(h) >= 24 ? `${parseInt(h) - 24}`.padStart(2, '0') + ':' : h + ':'))} の注文は6/12の売上
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      ※ 26:00まで入力可能（26:00 = 翌日2:00）
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      {businessHours ? formatBusinessHours(businessHours) : '未設定'}
                    </span>
                    {businessHours?.isNextDay && (
                      <div className="text-xs text-gray-600">
                        <div>会計日: 営業開始 ～ 翌日営業開始</div>
                        <div>例: {businessHours.openTime}の注文は同日、翌{businessHours.closeTime.replace(/^([0-2][0-6]):/, (_, h) => (parseInt(h) >= 24 ? `${parseInt(h) - 24}`.padStart(2, '0') + ':' : h + ':'))}の注文も同日扱い</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 会計日の説明 */}
              {businessHours && !isEditingHours && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>会計日の計算:</strong> 営業開始時刻（{businessHours.openTime}）から次の営業開始時刻までを1営業日として集計します
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 営業時間編集時のボタン */}
          {isEditingHours && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancelBusinessHours}
                disabled={businessHoursLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveBusinessHours}
                disabled={businessHoursLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {businessHoursLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                )}
                {businessHoursLoading ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoresPage;