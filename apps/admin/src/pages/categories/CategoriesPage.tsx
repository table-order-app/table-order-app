import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  Category 
} from "../../services/menuService";

const CategoriesPage = () => {
  const navigate = useNavigate();
  
  // カテゴリデータ
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // フォームデータ
  const [editFormData, setEditFormData] = useState<{
    id: number;
    name: string;
    description: string;
  }>({
    id: 0,
    name: "",
    description: "",
  });
  
  const [addFormData, setAddFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // APIからデータを取得
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategories();
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.error || 'カテゴリデータの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時にデータを取得
  useEffect(() => {
    fetchCategories();
  }, []);

  // バリデーション関数
  const validateForm = (data: {name: string}): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.trim().length === 0) {
      errors.name = "カテゴリ名を入力してください";
    }

    if (data.name && data.name.trim().length > 50) {
      errors.name = "カテゴリ名は50文字以下で入力してください";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const handleOpenEditModal = (category: Category) => {
    setSelectedCategory(category);
    setEditFormData({ 
      id: category.id,
      name: category.name,
      description: category.description || "",
    });
    setError(null);
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setEditFormData({
      ...editFormData,
      [name]: value,
    });

    // リアルタイムバリデーション
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setAddFormData({
      ...addFormData,
      [name]: value,
    });

    // リアルタイムバリデーション
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };

  const handleEditCategory = async () => {
    if (!validateForm(editFormData)) {
      return;
    }

    try {
      setError(null);
      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
      };

      const result = await updateCategory(editFormData.id, updateData);
      
      if (result.success) {
        await fetchCategories();
        setIsEditModalOpen(false);
        setSelectedCategory(null);
        setValidationErrors({});
      } else {
        setError(result.error || 'カテゴリの更新に失敗しました');
      }
    } catch (error) {
      console.error("カテゴリの更新に失敗しました", error);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      const result = await deleteCategory(selectedCategory.id);
      
      if (result.success) {
        await fetchCategories();
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
      } else {
        setError(result.error || 'カテゴリの削除に失敗しました');
      }
    } catch (error) {
      console.error("カテゴリの削除に失敗しました", error);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
  };
  
  const handleAddCategory = async () => {
    if (!validateForm(addFormData)) {
      return;
    }

    try {
      setError(null);
      const createData = {
        name: addFormData.name,
        description: addFormData.description,
      };

      const result = await createCategory(createData);
      
      if (result.success) {
        await fetchCategories();
        setAddFormData({
          name: "",
          description: "",
        });
        setIsAddModalOpen(false);
        setValidationErrors({});
      } else {
        setError(result.error || 'カテゴリの追加に失敗しました');
      }
    } catch (error) {
      console.error("カテゴリの追加に失敗しました", error);
      setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
  };

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">カテゴリ管理</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-700">メニューカテゴリの管理を行います</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">ダッシュボードに戻る</span>
            <span className="sm:hidden">戻る</span>
          </button>
        </div>
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

      {/* Category List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg leading-6 font-medium text-gray-900">カテゴリ一覧</h3>
                <p className="mt-1 text-sm text-gray-500">
                  全カテゴリ - {categories.length}個
                </p>
              </div>
              <div className="flex-shrink-0">
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
                  カテゴリ追加
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">カテゴリデータを読み込み中...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">カテゴリがありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                新しいカテゴリを追加して始めましょう。
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
                        <th className="table-header-cell" style={{ width: '40%' }}>カテゴリ名</th>
                        <th className="table-header-cell" style={{ width: '40%' }}>説明</th>
                        <th className="table-header-cell" style={{ width: '12%' }}>登録日</th>
                        <th className="relative px-6 py-3" style={{ width: '8%' }}>
                          <span className="sr-only">操作</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {categories.map((category) => {
                        return (
                          <tr key={category.id} className="table-row">
                            <td className="table-cell">
                              <div className="flex items-center min-w-0">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="ml-4 min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 table-cell-content">{category.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm text-gray-500 table-cell-content">
                                {category.description || '説明なし'}
                              </div>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm text-gray-500 table-cell-nowrap">
                                {category.createdAt ? new Date(category.createdAt).toLocaleDateString('ja-JP') : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium table-cell-nowrap">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors duration-200"
                                  onClick={() => handleOpenEditModal(category)}
                                >
                                  編集
                                </button>
                                <button 
                                  className="text-red-600 hover:text-red-900 font-medium transition-colors duration-200"
                                  onClick={() => handleOpenDeleteDialog(category)}
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
                {categories.map((category) => {
                  return (
                    <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 truncate">{category.name}</h4>
                              {category.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              {category.createdAt ? new Date(category.createdAt).toLocaleDateString('ja-JP') : '-'}
                            </div>
                          </div>
                          <div className="mt-4 flex space-x-2">
                            <button 
                              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                              onClick={() => handleOpenEditModal(category)}
                            >
                              編集
                            </button>
                            <button 
                              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                              onClick={() => handleOpenDeleteDialog(category)}
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
          title="カテゴリ情報の編集"
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
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditCategory(); }} className="space-y-6">
            <div>
              <label className="form-label">
                カテゴリ名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={editFormData.name || ""}
                onChange={handleInputChange}
                className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="メイン料理"
                required
              />
              {validationErrors.name && (
                <p className="form-error">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="form-label">説明</label>
              <textarea
                name="description"
                value={editFormData.description || ""}
                onChange={handleInputChange}
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

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setValidationErrors({});
            setError(null);
          }}
          title="新しいカテゴリの追加"
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
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddCategory(); }} className="space-y-6">
            <div>
              <label className="form-label">
                カテゴリ名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={addFormData.name || ""}
                onChange={handleAddInputChange}
                className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="メイン料理"
                required
              />
              {validationErrors.name && (
                <p className="form-error">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="form-label">説明</label>
              <textarea
                name="description"
                value={addFormData.description || ""}
                onChange={handleAddInputChange}
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

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteCategory}
          title="カテゴリの削除"
          message={`カテゴリ「${selectedCategory?.name}」を削除してもよろしいですか？このカテゴリに属するメニューアイテムは「未分類」に移動されます。この操作は元に戻せません。`}
          confirmText="削除"
          variant="danger"
        />
      )}
    </div>
  );
};

export default CategoriesPage;