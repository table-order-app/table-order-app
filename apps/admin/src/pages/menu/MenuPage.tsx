import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { 
  getCategories, 
  getMenuItems, 
  updateMenuItem, 
  deleteMenuItem, 
  createMenuItem, 
  createCategory,
  MenuItem,
  Category,
  CreateMenuItemData,
  CreateCategoryData
} from "../../services/menuService";

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
  
  const [addFormData, setAddFormData] = useState<CreateMenuItemData>({
    name: "",
    description: "",
    price: 0,
    categoryId: 0,
    available: true,
  });
  
  const [addCategoryData, setAddCategoryData] = useState<CreateCategoryData>({
    name: "",
  });

  // 選択中のカテゴリ
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // APIからカテゴリデータを取得
  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
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
      if (response.success && response.data) {
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
    const initializeData = async () => {
      await fetchCategories();
      await fetchMenuItems();
    };
    
    initializeData();
  }, []);
  
  // カテゴリが更新されたときにフォームの初期値を更新
  useEffect(() => {
    if (categories.length > 0 && addFormData.categoryId === 0) {
      setAddFormData(prev => ({
        ...prev,
        categoryId: categories[0].id
      }));
    }
  }, [categories, addFormData.categoryId]);

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
    setError(null); // エラーメッセージをクリア
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
    // バリデーション
    if (!editFormData.name.trim()) {
      setError('メニュー名を入力してください');
      return;
    }
    
    if (editFormData.price <= 0) {
      setError('価格は0より大きい値を入力してください');
      return;
    }
    
    if (!editFormData.categoryId || editFormData.categoryId === 0) {
      setError('カテゴリを選択してください');
      return;
    }
    
    try {
      setError(null);
      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        price: editFormData.price,
        categoryId: editFormData.categoryId,
        available: editFormData.available
      };
      
      const result = await updateMenuItem(editFormData.id.toString(), updateData);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setIsEditModalOpen(false);
        setSelectedItem(null);
      } else {
        setError(result.error || 'メニュー項目の更新に失敗しました');
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
    // バリデーション
    if (!addCategoryData.name.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }
    
    try {
      setError(null);
      const createData = {
        name: addCategoryData.name.trim(),
        description: addCategoryData.description?.trim()
      };
      
      const result = await createCategory(createData);
      
      if (result.success) {
        // カテゴリデータを再取得
        await fetchCategories();
        
        setAddCategoryData({ name: "" });
        setIsAddCategoryModalOpen(false);
      } else {
        setError(result.error || 'カテゴリの追加に失敗しました');
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
    console.log('handleAddItem called with data:', addFormData);
    
    // バリデーション
    if (!addFormData.name.trim()) {
      setError('メニュー名を入力してください');
      return;
    }
    
    if (addFormData.price <= 0) {
      setError('価格は0より大きい値を入力してください');
      return;
    }
    
    if (!addFormData.categoryId || addFormData.categoryId === 0) {
      setError('カテゴリを選択してください');
      return;
    }
    
    try {
      setError(null);
      const createData = {
        name: addFormData.name.trim(),
        description: addFormData.description.trim(),
        price: addFormData.price,
        categoryId: addFormData.categoryId,
        available: addFormData.available
      };
      
      console.log('Sending data to API:', createData);
      const result = await createMenuItem(createData);
      console.log('API result:', result);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setAddFormData({
          name: "",
          description: "",
          price: 0,
          categoryId: categories.length > 0 ? categories[0].id : 1,
          available: true,
        });
        setIsAddModalOpen(false);
      } else {
        setError(result.error || 'メニュー項目の追加に失敗しました');
      }
    } catch (error) {
      console.error("メニュー項目の追加に失敗しました", error);
      setError('メニュー項目の追加中にエラーが発生しました');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">メニュー管理</h1>
          <p className="mt-2 text-sm text-gray-700">レストランのメニュー項目とカテゴリを管理します</p>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          ダッシュボードに戻る
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                onClick={() => setError(null)}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">カテゴリ</h3>
            <button
              onClick={() => {
                setError(null);
                setIsAddCategoryModalOpen(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              カテゴリ追加
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedCategory === null
                  ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              すべて ({menuItems.length})
            </button>

            {categories.map((category) => {
              const itemCount = menuItems.filter(item => item.categoryId === category.id).length;
              return (
                <button
                  key={category.id}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({itemCount})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">メニュー一覧</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedCategory ? `${getCategoryName(selectedCategory)} カテゴリ` : '全カテゴリ'} - {filteredItems.length}件のメニュー
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              メニュー追加
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">メニューデータを読み込み中...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">メニューがありません</h3>
              <p className="mt-1 text-sm text-gray-500">新しいメニュー項目を追加して始めましょう。</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
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
                    <th className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
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
                        <div className="text-sm text-gray-900 font-medium">
                          ¥{item.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryName(item.categoryId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.available ? "提供中" : "停止中"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            編集
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 font-medium"
                            onClick={() => handleOpenDeleteDialog(item)}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="メニュー項目の編集"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditItem(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  メニュー名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name || ""}
                  onChange={handleInputChange}
                  className="form-input mt-1"
                  placeholder="商品名を入力"
                  required
                />
              </div>
              
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  価格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price || ""}
                  onChange={handleInputChange}
                  className="form-input mt-1"
                  placeholder="価格を入力"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <textarea
                name="description"
                value={editFormData.description || ""}
                onChange={handleInputChange}
                rows={3}
                className="form-textarea mt-1"
                placeholder="商品の説明を入力（任意）"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={editFormData.categoryId || ""}
                onChange={handleInputChange}
                className="form-select mt-1"
                required
              >
                <option value="">カテゴリを選択してください</option>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setEditFormData({
                    ...editFormData,
                    available: e.target.checked,
                  })
                }
                className="form-checkbox"
              />
              <label className="ml-2 block text-sm text-gray-900">
                提供中（チェックを外すと注文を停止できます）
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                保存
              </button>
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
          confirmText="削除"
          variant="danger"
        />
      )}

      {/* メニュー追加モーダル */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="メニュー項目の追加"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddItem(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  メニュー名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={addFormData.name || ""}
                  onChange={handleAddItemInputChange}
                  className="form-input mt-1"
                  placeholder="商品名を入力"
                  required
                />
              </div>
              
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  価格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={addFormData.price || ""}
                  onChange={handleAddItemInputChange}
                  className="form-input mt-1"
                  placeholder="価格を入力"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <textarea
                name="description"
                value={addFormData.description || ""}
                onChange={handleAddItemInputChange}
                rows={3}
                className="form-textarea mt-1"
                placeholder="商品の説明を入力（任意）"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={addFormData.categoryId || ""}
                onChange={handleAddItemInputChange}
                className="form-select mt-1"
                required
              >
                <option value="">カテゴリを選択してください</option>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setAddFormData({
                    ...addFormData,
                    available: e.target.checked,
                  })
                }
                className="form-checkbox"
              />
              <label className="ml-2 block text-sm text-gray-900">
                提供中（チェックを外すと注文を停止できます）
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                追加
              </button>
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
          size="md"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddCategory(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリ名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={addCategoryData.name || ""}
                onChange={handleAddCategoryInputChange}
                className="form-input mt-1"
                placeholder="カテゴリ名を入力"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsAddCategoryModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                追加
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MenuPage;