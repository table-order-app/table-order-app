import { Button } from "@table-order-system/ui";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { getCategories, getMenuItems, updateMenuItem, deleteMenuItem, createMenuItem, createCategory } from "../../services/menuService";

// メニューアイテムの型定義
type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  image?: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// カテゴリの型定義
type Category = {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

const MenuPage = () => {
  const navigate = useNavigate();

  // カテゴリデータ（APIから取得）
  const [categories, setCategories] = useState<Category[]>([]);
  
  // メニューデータ（APIから取得）
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editFormData, setEditFormData] = useState<MenuItem>({
    id: 0,
    name: "",
    description: "",
    price: 0,
    categoryId: 0,
    available: true,
  });
  
  const [addFormData, setAddFormData] = useState<Omit<MenuItem, "id" | "createdAt" | "updatedAt">>({
    name: "",
    description: "",
    price: 0,
    categoryId: 0,
    available: true,
  });
  
  const [addCategoryData, setAddCategoryData] = useState<Omit<Category, "id">>({
    name: "",
  });

  // 選択中のカテゴリ
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // APIからカテゴリデータを取得
  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      } else {
        setError('カテゴリデータの取得に失敗しました');
      }
    } catch (err) {
      setError('カテゴリデータの取得中にエラーが発生しました');
      console.error('Error fetching categories:', err);
    }
  };

  // APIからメニューデータを取得
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMenuItems();
      if (response.success) {
        setMenuItems(response.data);
      } else {
        setError('メニューデータの取得に失敗しました');
      }
    } catch (err) {
      setError('メニューデータの取得中にエラーが発生しました');
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時にデータを取得
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  // フィルタリングされたメニューアイテム
  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.categoryId === selectedCategory)
    : menuItems;

  // カテゴリ名を取得する関数
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "不明なカテゴリ";
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setEditFormData({ ...item });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData({
        ...editFormData,
        [name]: checked,
      });
    } else if (name === 'price') {
      setEditFormData({
        ...editFormData,
        [name]: parseInt(value, 10) || 0,
      });
    } else if (name === 'categoryId') {
      setEditFormData({
        ...editFormData,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
      });
    }
  };

  const handleEditItem = async () => {
    try {
      const result = await updateMenuItem(editFormData.id.toString(), editFormData);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setIsEditModalOpen(false);
        setSelectedItem(null);
      } else {
        setError('メニュー項目の更新に失敗しました');
      }
    } catch (error) {
      console.error("メニュー項目の更新に失敗しました", error);
      setError('メニュー項目の更新中にエラーが発生しました');
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      const result = await deleteMenuItem(selectedItem.id.toString());
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      } else {
        setError('メニュー項目の削除に失敗しました');
      }
    } catch (error) {
      console.error("メニュー項目の削除に失敗しました", error);
      setError('メニュー項目の削除中にエラーが発生しました');
    }
  };
  
  const handleAddCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddCategoryData({
      ...addCategoryData,
      [name]: value,
    });
  };
  
  const handleAddCategory = async () => {
    try {
      const result = await createCategory(addCategoryData);
      
      if (result.success) {
        // カテゴリデータを再取得
        await fetchCategories();
        
        setAddCategoryData({ name: "" });
        setIsAddCategoryModalOpen(false);
      } else {
        setError('カテゴリの追加に失敗しました');
      }
    } catch (error) {
      console.error("カテゴリの追加に失敗しました", error);
      setError('カテゴリの追加中にエラーが発生しました');
    }
  };
  
  const handleAddItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setAddFormData({
        ...addFormData,
        [name]: checked,
      });
    } else if (name === 'price') {
      setAddFormData({
        ...addFormData,
        [name]: parseInt(value, 10) || 0,
      });
    } else if (name === 'categoryId') {
      setAddFormData({
        ...addFormData,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setAddFormData({
        ...addFormData,
        [name]: value,
      });
    }
  };
  
  const handleAddItem = async () => {
    try {
      const result = await createMenuItem(addFormData);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setAddFormData({
          name: "",
          description: "",
          price: 0,
          categoryId: categories.length > 0 ? categories[0].id : 0,
          available: true,
        });
        setIsAddModalOpen(false);
      } else {
        setError('メニュー項目の追加に失敗しました');
      }
    } catch (error) {
      console.error("メニュー項目の追加に失敗しました", error);
      setError('メニュー項目の追加中にエラーが発生しました');
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">メニュー管理</h2>
        <Button
          label="ダッシュボードに戻る"
          variant="secondary"
          onClick={handleBack}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">カテゴリ</h3>
          <Button 
            label="カテゴリ追加" 
            variant="secondary" 
            onClick={() => setIsAddCategoryModalOpen(true)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-full ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            すべて
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === category.id
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">メニュー一覧</h3>
          <Button 
            label="メニュー追加" 
            onClick={() => setIsAddModalOpen(true)}
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">メニューデータを読み込み中...</p>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  説明
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ¥{item.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getCategoryName(item.categoryId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.available ? "提供中" : "停止中"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary-dark mr-3"
                        onClick={() => handleOpenEditModal(item)}
                      >
                        編集
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleOpenDeleteDialog(item)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    表示するメニューアイテムがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="メニュー項目の編集"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleEditItem(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  価格
                </label>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  カテゴリ
                </label>
                <select
                  name="categoryId"
                  value={editFormData.categoryId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  checked={editFormData.available}
                  onChange={(e) => 
                    setEditFormData({
                      ...editFormData,
                      available: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  提供中
                </label>
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
              <Button
                label="キャンセル"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              />
              <Button
                label="保存"
                onClick={handleEditItem}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteItem}
          title="メニュー項目の削除"
          message={`「${selectedItem?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
        />
      )}

      {/* メニュー追加モーダル */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="メニュー項目の追加"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  value={addFormData.name}
                  onChange={handleAddItemInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  name="description"
                  value={addFormData.description}
                  onChange={handleAddItemInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  価格
                </label>
                <input
                  type="number"
                  name="price"
                  value={addFormData.price}
                  onChange={handleAddItemInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  カテゴリ
                </label>
                <select
                  name="categoryId"
                  value={addFormData.categoryId}
                  onChange={handleAddItemInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  checked={addFormData.available}
                  onChange={(e) => 
                    setAddFormData({
                      ...addFormData,
                      available: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  提供中
                </label>
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
              <Button
                label="キャンセル"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
              />
              <Button
                label="追加"
                onClick={handleAddItem}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* カテゴリ追加モーダル */}
      {isAddCategoryModalOpen && (
        <Modal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          title="カテゴリの追加"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  カテゴリ名
                </label>
                <input
                  type="text"
                  name="name"
                  value={addCategoryData.name}
                  onChange={handleAddCategoryInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
              <Button
                label="キャンセル"
                variant="secondary"
                onClick={() => setIsAddCategoryModalOpen(false)}
              />
              <Button
                label="追加"
                onClick={handleAddCategory}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MenuPage;
