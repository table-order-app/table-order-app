import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { 
  getStaffMembers, 
  updateStaffMember, 
  deleteStaffMember, 
  createStaffMember
} from "../../services/staffService";

// スタッフの型定義
type Staff = {
  id: number;
  name: string;
  loginId: string;
  role: string;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const StaffPage = () => {
  const navigate = useNavigate();

  // スタッフデータ（APIから取得）
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // フォームデータ
  const [editFormData, setEditFormData] = useState<{id: number, name: string, loginId: string}>({
    id: 0,
    name: "",
    loginId: "",
  });
  
  const [addFormData, setAddFormData] = useState<{name: string, loginId: string, password: string}>({
    name: "",
    loginId: "",
    password: "",
  });

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // APIからスタッフデータを取得
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStaffMembers();
      if (response.success && response.data) {
        setStaffList(response.data);
      } else {
        setError('スタッフデータの取得に失敗しました');
      }
    } catch (err) {
      setError('スタッフデータの取得中にエラーが発生しました');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時にデータを取得
  useEffect(() => {
    fetchStaff();
  }, []);

  // バリデーション関数
  const validateForm = (data: {name: string, loginId: string, password?: string}): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.trim().length === 0) {
      errors.name = "スタッフ名を入力してください";
    }

    if (!data.loginId || data.loginId.trim().length === 0) {
      errors.loginId = "ログインIDを入力してください";
    }

    if (data.password !== undefined && data.password.length < 6) {
      errors.password = "パスワードは6文字以上で入力してください";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const handleOpenEditModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditFormData({ 
      id: staff.id,
      name: staff.name,
      loginId: staff.loginId
    });
    setError(null);
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleEditStaff = async () => {
    if (!validateForm(editFormData)) {
      return;
    }

    try {
      setError(null);
      const updateData = {
        name: editFormData.name,
        loginId: editFormData.loginId,
      };

      const result = await updateStaffMember(editFormData.id.toString(), updateData);
      
      if (result.success) {
        await fetchStaff();
        setIsEditModalOpen(false);
        setSelectedStaff(null);
        setValidationErrors({});
      } else {
        setError(result.error || 'スタッフの更新に失敗しました');
      }
    } catch (error) {
      console.error("スタッフの更新に失敗しました", error);
      setError('スタッフの更新中にエラーが発生しました');
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      const result = await deleteStaffMember(selectedStaff.id.toString());
      
      if (result.success) {
        await fetchStaff();
        setIsDeleteDialogOpen(false);
        setSelectedStaff(null);
      } else {
        setError('スタッフの削除に失敗しました');
      }
    } catch (error) {
      console.error("スタッフの削除に失敗しました", error);
      setError('スタッフの削除中にエラーが発生しました');
    }
  };
  
  const handleAddStaff = async () => {
    if (!validateForm(addFormData)) {
      return;
    }

    try {
      setError(null);
      const createData = {
        name: addFormData.name,
        loginId: addFormData.loginId,
        password: addFormData.password,
      };

      const result = await createStaffMember(createData);
      
      if (result.success) {
        await fetchStaff();
        setAddFormData({
          name: "",
          loginId: "",
          password: "",
        });
        setIsAddModalOpen(false);
        setValidationErrors({});
      } else {
        setError(result.error || 'スタッフの追加に失敗しました');
      }
    } catch (error) {
      console.error("スタッフの追加に失敗しました", error);
      setError('スタッフの追加中にエラーが発生しました');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">スタッフ管理</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-700">店舗のスタッフ情報を管理します</p>
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

      {/* Staff List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">スタッフ一覧</h3>
              <p className="mt-1 text-sm text-gray-500">
                全スタッフ - {staffList.length}人
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setValidationErrors({});
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              スタッフ追加
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">スタッフデータを読み込み中...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">スタッフがいません</h3>
              <p className="mt-1 text-sm text-gray-500">
                新しいスタッフを追加して始めましょう。
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">スタッフ名</th>
                    <th className="table-header-cell">ログインID</th>
                    <th className="table-header-cell">登録日</th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {staffList.map((staff) => {
                    return (
                      <tr key={staff.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">{staff.loginId}</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-500">
                            {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('ja-JP') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors duration-200"
                              onClick={() => handleOpenEditModal(staff)}
                            >
                              編集
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900 font-medium transition-colors duration-200"
                              onClick={() => handleOpenDeleteDialog(staff)}
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
          title="スタッフ情報の編集"
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
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditStaff(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  スタッフ名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name || ""}
                  onChange={handleInputChange}
                  className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="山田 太郎"
                  required
                />
                {validationErrors.name && (
                  <p className="form-error">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">
                  ログインID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="loginId"
                  value={editFormData.loginId || ""}
                  onChange={handleInputChange}
                  className={`form-input mt-1 ${validationErrors.loginId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="yamada_taro"
                  required
                />
                {validationErrors.loginId && (
                  <p className="form-error">{validationErrors.loginId}</p>
                )}
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

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteStaff}
          title="スタッフの削除"
          message={`スタッフ「${selectedStaff?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
          confirmText="削除"
          variant="danger"
        />
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setValidationErrors({});
            setError(null);
          }}
          title="新しいスタッフの追加"
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
          
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddStaff(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  スタッフ名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={addFormData.name || ""}
                  onChange={handleAddInputChange}
                  className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="山田 太郎"
                  required
                />
                {validationErrors.name && (
                  <p className="form-error">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">
                  ログインID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="loginId"
                  value={addFormData.loginId || ""}
                  onChange={handleAddInputChange}
                  className={`form-input mt-1 ${validationErrors.loginId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="yamada_taro"
                  required
                />
                {validationErrors.loginId && (
                  <p className="form-error">{validationErrors.loginId}</p>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={addFormData.password || ""}
                onChange={handleAddInputChange}
                className={`form-input mt-1 ${validationErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="6文字以上"
                required
              />
              {validationErrors.password && (
                <p className="form-error">{validationErrors.password}</p>
              )}
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
    </div>
  );
};

export default StaffPage;