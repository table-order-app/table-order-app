import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { 
  getMenuItems, 
  getCategories,
  updateMenuItem, 
  deleteMenuItem, 
  createMenuItem,
  createMenuItemWithFile,
  createCategory,
  MenuItem,
  Category
} from "../../services/menuService";
import { getImageUrl, getImageUrlWithFallback } from "../../utils/imageUtils";

const MenuPage = () => {
  const navigate = useNavigate();
  
  // メニューとカテゴリデータ
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // フォームデータ
  const [editFormData, setEditFormData] = useState<{
    id: number;
    categoryId: number | null;
    name: string;
    description: string;
    price: number;
    image: string;
    available: boolean;
  }>({
    id: 0,
    categoryId: null,
    name: "",
    description: "",
    price: 0,
    image: "",
    available: true,
  });
  
  const [addFormData, setAddFormData] = useState<{
    categoryId: number | null;
    name: string;
    description: string;
    price: number;
    image: string;
    imageFile: File | null;
    available: boolean;
  }>({
    categoryId: null,
    name: "",
    description: "",
    price: 0,
    image: "",
    imageFile: null,
    available: true,
  });

  const [categoryFormData, setCategoryFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // APIからデータを取得
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menuResponse, categoryResponse] = await Promise.all([
        getMenuItems(),
        getCategories()
      ]);
      
      if (menuResponse.success && menuResponse.data) {
        setMenuItems(menuResponse.data);
      } else {
        setError(menuResponse.error || 'メニューデータの取得に失敗しました');
      }
      
      if (categoryResponse.success && categoryResponse.data) {
        setCategories(categoryResponse.data);
      } else {
        setError(categoryResponse.error || 'カテゴリデータの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時にデータを取得
  useEffect(() => {
    fetchData();
  }, []);

  // バリデーション関数
  const validateMenuForm = (data: {name: string, price: number}): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.trim().length === 0) {
      errors.name = "メニュー名を入力してください";
    }

    if (!data.price || data.price <= 0) {
      errors.price = "価格は1円以上を入力してください";
    }

    if (data.price && data.price > 999999) {
      errors.price = "価格は999,999円以下を入力してください";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCategoryForm = (data: {name: string}): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.trim().length === 0) {
      errors.categoryName = "カテゴリ名を入力してください";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setEditFormData({ 
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || "",
      price: item.price,
      image: item.image || "",
      available: item.available
    });
    setError(null);
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData({
        ...editFormData,
        [name]: checked,
      });
    } else if (name === 'price' || name === 'categoryId') {
      setEditFormData({
        ...editFormData,
        [name]: name === 'categoryId' && value === '' ? null : parseInt(value, 10) || 0,
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
      });
    }

    // リアルタイムバリデーション
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setAddFormData({
        ...addFormData,
        [name]: checked,
      });
    } else if (name === 'price' || name === 'categoryId') {
      setAddFormData({
        ...addFormData,
        [name]: name === 'categoryId' && value === '' ? null : parseInt(value, 10) || 0,
      });
    } else {
      setAddFormData({
        ...addFormData,
        [name]: value,
      });
    }

    // リアルタイムバリデーション
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryFormData({
      ...categoryFormData,
      [name]: value,
    });

    // リアルタイムバリデーション
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };

  const handleEditMenuItem = async () => {
    if (!validateMenuForm(editFormData)) {
      return;
    }

    try {
      setError(null);
      const updateData = {
        categoryId: editFormData.categoryId,
        name: editFormData.name,
        description: editFormData.description,
        price: editFormData.price,
        image: editFormData.image,
        available: editFormData.available,
      };

      const result = await updateMenuItem(editFormData.id.toString(), updateData);
      
      if (result.success) {
        await fetchData();
        setIsEditModalOpen(false);
        setSelectedItem(null);
        setValidationErrors({});
      } else {
        setError(result.error || 'メニューの更新に失敗しました');
      }
    } catch (error) {
      console.error("メニューの更新に失敗しました", error);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!selectedItem) return;
    
    try {
      const result = await deleteMenuItem(selectedItem.id.toString());
      
      if (result.success) {
        await fetchData();
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      } else {
        // バックエンドからの具体的なエラーメッセージを表示
        setError(result.error || 'メニューの削除に失敗しました');
      }
    } catch (error) {
      console.error("メニューの削除に失敗しました", error);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
  };
  
  const handleAddMenuItem = async () => {
    if (!validateMenuForm(addFormData)) {
      return;
    }

    try {
      setError(null);
      let result;

      // ファイルアップロードまたはURL入力かを判定
      if (addFormData.imageFile) {
        // ファイルアップロードの場合
        const formData = new FormData();
        formData.append('name', addFormData.name);
        formData.append('description', addFormData.description || '');
        formData.append('price', addFormData.price.toString());
        if (addFormData.categoryId) {
          formData.append('categoryId', addFormData.categoryId.toString());
        }
        formData.append('available', addFormData.available.toString());
        formData.append('image', addFormData.imageFile);

        result = await createMenuItemWithFile(formData);
      } else {
        // 従来のJSON送信（URL入力またはファイルなし）
        const createData = {
          categoryId: addFormData.categoryId,
          name: addFormData.name,
          description: addFormData.description,
          price: addFormData.price,
          image: addFormData.image,
          available: addFormData.available,
        };

        result = await createMenuItem(createData);
      }
      
      if (result.success) {
        await fetchData();
        setAddFormData({
          categoryId: null,
          name: "",
          description: "",
          price: 0,
          image: "",
          imageFile: null,
          available: true,
        });
        setIsAddModalOpen(false);
        setValidationErrors({});
      } else {
        setError(result.error || 'メニューの追加に失敗しました');
      }
    } catch (error) {
      console.error("メニューの追加に失敗しました", error);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
  };

  const handleAddCategory = async () => {
    if (!validateCategoryForm(categoryFormData)) {
      return;
    }

    try {
      setError(null);
      const result = await createCategory(categoryFormData);
      
      if (result.success) {
        await fetchData();
        setCategoryFormData({
          name: "",
          description: "",
        });
        setIsCategoryModalOpen(false);
        setValidationErrors({});
      } else {
        setError(result.error || 'カテゴリの追加に失敗しました');
      }
    } catch (error) {
      console.error("カテゴリの追加に失敗しました", error);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "未分類";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "不明なカテゴリ";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">メニュー管理</h1>
          <p className="mt-2 text-sm text-gray-700">店舗のメニュー情報を管理します</p>
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
                <p className="whitespace-pre-line">{error}</p>
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

      {/* Menu List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg leading-6 font-medium text-gray-900">メニュー一覧</h3>
                <p className="mt-1 text-sm text-gray-500">
                  全メニュー - {menuItems.length}品 | カテゴリ - {categories.length}個
                </p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => {
                    setError(null);
                    setValidationErrors({});
                    setIsCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  カテゴリ追加
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setValidationErrors({});
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  メニュー追加
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">メニューデータを読み込み中...</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">メニューがありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                新しいメニューを追加して始めましょう。
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">メニュー名</th>
                        <th className="table-header-cell">カテゴリ</th>
                        <th className="table-header-cell">価格</th>
                        <th className="table-header-cell">状態</th>
                        <th className="table-header-cell">登録日</th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">操作</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {menuItems.map((item) => {
                        return (
                          <tr key={item.id} className="table-row">
                            <td className="table-cell">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {getImageUrl(item.image) ? (
                                    <img className="h-10 w-10 rounded-full object-cover" src={getImageUrlWithFallback(item.image)} alt={item.name} />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  {item.description && (
                                    <div className="text-sm text-gray-500">{item.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {getCategoryName(item.categoryId)}
                              </span>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm text-gray-900">¥{item.price?.toLocaleString()}</div>
                            </td>
                            <td className="table-cell">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.available ? '提供中' : '提供停止'}
                              </span>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm text-gray-500">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ja-JP') : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors duration-200"
                                  onClick={() => handleOpenEditModal(item)}
                                >
                                  編集
                                </button>
                                <button 
                                  className="text-red-600 hover:text-red-900 font-medium transition-colors duration-200"
                                  onClick={() => handleOpenDeleteDialog(item)}
                                >
                                  削除
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {menuItems.map((item) => {
                  return (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getImageUrl(item.image) ? (
                            <img className="h-16 w-16 rounded-lg object-cover" src={getImageUrlWithFallback(item.image)} alt={item.name} />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-300 flex items-center justify-center">
                              <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 truncate">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2 ml-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.available ? '提供中' : '停止'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold text-gray-900">¥{item.price?.toLocaleString()}</span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {getCategoryName(item.categoryId)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ja-JP') : '-'}
                            </div>
                          </div>
                          <div className="mt-4 flex space-x-2">
                            <button 
                              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              編集
                            </button>
                            <button 
                              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                              onClick={() => handleOpenDeleteDialog(item)}
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setValidationErrors({});
            setError(null);
          }}
          title="メニュー情報の編集"
          size="lg"
        >
          {/* Modal Error Alert */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p className="whitespace-pre-line">{error}</p>
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
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditMenuItem(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  メニュー名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name || ""}
                  onChange={handleInputChange}
                  className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="ハンバーガー"
                  required
                />
                {validationErrors.name && (
                  <p className="form-error">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">カテゴリ</label>
                <select
                  name="categoryId"
                  value={editFormData.categoryId || ""}
                  onChange={handleInputChange}
                  className="form-input mt-1"
                >
                  <option value="">未分類</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="form-label">
                  価格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price || ""}
                  onChange={handleInputChange}
                  className={`form-input mt-1 ${validationErrors.price ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="500"
                  min="1"
                  max="999999"
                  required
                />
                {validationErrors.price && (
                  <p className="form-error">{validationErrors.price}</p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="form-label">画像</label>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // ファイルサイズチェック (2MB以下)
                        if (file.size > 2 * 1024 * 1024) {
                          setError('画像ファイルのサイズは2MB以下にしてください');
                          return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // 最大サイズを設定 (幅800px)
                            const maxWidth = 800;
                            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                            
                            canvas.width = img.width * ratio;
                            canvas.height = img.height * ratio;
                            
                            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                            
                            // 圧縮した画像をBase64で取得 (品質70%)
                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                            
                            setEditFormData({
                              ...editFormData,
                              image: compressedDataUrl
                            });
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {getImageUrl(editFormData.image) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">現在の画像:</p>
                      <img
                        src={getImageUrlWithFallback(editFormData.image)}
                        alt="現在の画像"
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">説明</label>
                <textarea
                  name="description"
                  value={editFormData.description || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-input mt-1"
                  placeholder="メニューの詳細な説明を入力してください"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="available"
                    checked={editFormData.available}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    メニューを提供中にする
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setValidationErrors({});
                  setError(null);
                }}
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

      {/* Add Menu Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setValidationErrors({});
            setError(null);
          }}
          title="新しいメニューの追加"
          size="lg"
        >
          {/* Modal Error Alert */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p className="whitespace-pre-line">{error}</p>
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
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddMenuItem(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  メニュー名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={addFormData.name || ""}
                  onChange={handleAddInputChange}
                  className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="ハンバーガー"
                  required
                />
                {validationErrors.name && (
                  <p className="form-error">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">カテゴリ</label>
                <select
                  name="categoryId"
                  value={addFormData.categoryId || ""}
                  onChange={handleAddInputChange}
                  className="form-input mt-1"
                >
                  <option value="">未分類</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="form-label">
                  価格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={addFormData.price || ""}
                  onChange={handleAddInputChange}
                  className={`form-input mt-1 ${validationErrors.price ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="500"
                  min="1"
                  max="999999"
                  required
                />
                {validationErrors.price && (
                  <p className="form-error">{validationErrors.price}</p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="form-label">画像</label>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // ファイルサイズチェック (5MB以下)
                        if (file.size > 5 * 1024 * 1024) {
                          setError('画像ファイルのサイズは5MB以下にしてください');
                          return;
                        }
                        
                        // ファイルタイプチェック
                        if (!file.type.startsWith('image/')) {
                          setError('画像ファイルを選択してください');
                          return;
                        }
                        
                        setAddFormData({
                          ...addFormData,
                          imageFile: file
                        });
                        
                        setError(null); // エラーをクリア
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500">
                    JPG、PNG、WebP形式 / 最大5MB
                  </p>
                  {addFormData.imageFile && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">プレビュー:</p>
                      <img
                        src={URL.createObjectURL(addFormData.imageFile)}
                        alt="プレビュー"
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ファイル: {addFormData.imageFile.name} ({Math.round(addFormData.imageFile.size / 1024)}KB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">説明</label>
                <textarea
                  name="description"
                  value={addFormData.description || ""}
                  onChange={handleAddInputChange}
                  rows={3}
                  className="form-input mt-1"
                  placeholder="メニューの詳細な説明を入力してください"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="available"
                    checked={addFormData.available}
                    onChange={handleAddInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    メニューを提供中にする
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setValidationErrors({});
                  setError(null);
                }}
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

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setValidationErrors({});
            setError(null);
          }}
          title="新しいカテゴリの追加"
          size="md"
        >
          {/* Modal Error Alert */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p className="whitespace-pre-line">{error}</p>
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
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddCategory(); }} className="space-y-6">
            <div>
              <label className="form-label">
                カテゴリ名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={categoryFormData.name || ""}
                onChange={handleCategoryInputChange}
                className={`form-input mt-1 ${validationErrors.categoryName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="メイン料理"
                required
              />
              {validationErrors.categoryName && (
                <p className="form-error">{validationErrors.categoryName}</p>
              )}
            </div>

            <div>
              <label className="form-label">説明</label>
              <textarea
                name="description"
                value={categoryFormData.description || ""}
                onChange={handleCategoryInputChange}
                rows={3}
                className="form-input mt-1"
                placeholder="カテゴリの説明を入力してください"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setValidationErrors({});
                  setError(null);
                }}
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

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteMenuItem}
          title="メニューの削除"
          message={`メニュー「${selectedItem?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
          confirmText="削除"
          variant="danger"
        />
      )}
    </div>
  );
};

export default MenuPage;