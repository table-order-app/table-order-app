import { useState } from 'react';
import { updateStore, Store, CreateStoreData, UpdateStoreData } from '../services/storeService';
import { Modal } from './Modal';

interface StoreFormProps {
  store?: Store;
  onSuccess: () => void;
  onCancel: () => void;
}

const StoreForm = ({ store, onSuccess, onCancel }: StoreFormProps) => {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    address: store?.address || '',
    phone: store?.phone || '',
    email: store?.email || '',
    active: store?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 空文字列をundefinedに変換
      const submitData = {
        name: formData.name,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        active: formData.active,
      };

      if (store) {
        // 編集
        await updateStore(store.id, submitData as UpdateStoreData);
      } else {
        // 新規作成
        await createStore(submitData as CreateStoreData);
      }
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={store ? '店舗情報編集' : '新規店舗登録'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 店舗名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            店舗名 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="店舗名を入力してください"
          />
        </div>

        {/* 住所 */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            住所
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            value={formData.address}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="住所を入力してください"
          />
        </div>

        {/* 電話番号 */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            電話番号
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="03-1234-5678"
          />
        </div>

        {/* メールアドレス */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="example@example.com"
          />
        </div>

        {/* アクティブ状態 */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">営業中</span>
          </label>
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </div>
            ) : (
              store ? '更新' : '登録'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StoreForm;