import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  role: "admin" | "manager" | "staff" | "kitchen";
  email: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// 役割の型定義
type Role = {
  id: "admin" | "manager" | "staff" | "kitchen";
  name: string;
  color: string;
  description: string;
};

const StaffPage = () => {
  const navigate = useNavigate();

  // 役割データ（固定値）
  const [roles] = useState<Role[]>([
    { 
      id: "admin", 
      name: "管理者", 
      color: "bg-purple-100 text-purple-800",
      description: "システム全体の管理権限"
    },
    { 
      id: "manager", 
      name: "マネージャー", 
      color: "bg-blue-100 text-blue-800",
      description: "店舗運営の管理権限"
    },
    { 
      id: "staff", 
      name: "一般スタッフ", 
      color: "bg-green-100 text-green-800",
      description: "接客・レジ業務"
    },
    { 
      id: "kitchen", 
      name: "キッチンスタッフ", 
      color: "bg-orange-100 text-orange-800",
      description: "調理業務"
    },
  ]);

  // スタッフデータ（APIから取得）
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 選択中の役割
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // フォームデータ
  const [editFormData, setEditFormData] = useState<Staff>({
    id: 0,
    name: "",
    role: "staff",
    email: "",
    active: true,
  });
  
  const [addFormData, setAddFormData] = useState<Omit<Staff, "id">>({
    name: "",
    role: "staff",
    email: "",
    active: true,
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

  // 初回ロード時にスタッフデータを取得
  useEffect(() => {
    fetchStaff();
  }, []);

  // フィルタリングされたスタッフリスト
  const filteredStaff = selectedRole
    ? staffList.filter((staff) => staff.role === selectedRole)
    : staffList;

  // 役割情報を取得する関数
  const getRoleInfo = (roleId: string) => {
    return roles.find((r) => r.id === roleId) || { 
      name: "不明な役割", 
      color: "bg-gray-100 text-gray-800",
      description: ""
    };
  };

  // バリデーション関数
  const validateForm = (data: Omit<Staff, "id"> | Staff): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = "名前を入力してください";
    } else if (data.name.trim().length < 2) {
      errors.name = "名前は2文字以上で入力してください";
    }

    if (!data.email.trim()) {
      errors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "正しいメールアドレスを入力してください";
    }

    if (!data.role) {
      errors.role = "役割を選択してください";
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
    setEditFormData({ ...staff });
    setError(null);
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData({
        ...editFormData,
        [name]: checked,
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

  const handleEditStaff = async () => {
    if (!validateForm(editFormData)) {
      return;
    }

    try {
      setError(null);
      const updateData = {
        name: editFormData.name.trim(),
        role: editFormData.role,
        email: editFormData.email.trim(),
        active: editFormData.active
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
  
  const handleAddStaffInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setAddFormData({
        ...addFormData,
        [name]: checked,
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
  
  const handleAddStaff = async () => {
    if (!validateForm(addFormData)) {
      return;
    }

    try {
      setError(null);
      const createData = {
        name: addFormData.name.trim(),
        role: addFormData.role,
        email: addFormData.email.trim(),
        active: addFormData.active
      };

      const result = await createStaffMember(createData);
      
      if (result.success) {
        await fetchStaff();
        setAddFormData({
          name: "",
          role: "staff",
          email: "",
          active: true,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">スタッフ管理</h1>
          <p className="mt-2 text-sm text-gray-700">店舗スタッフの管理と役割設定を行います</p>
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

      {/* Role Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">役割フィルター</h3>
            <div className="text-sm text-gray-500">
              スタッフを役割別に表示・管理
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedRole === null
                  ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedRole(null)}
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              すべて ({staffList.length})
            </button>

            {roles.map((role) => {
              const staffCount = staffList.filter(staff => staff.role === role.id).length;
              return (
                <button
                  key={role.id}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedRole === role.id
                      ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                  title={role.description}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${role.color.replace('text-', 'bg-').replace('100', '500')}`}></span>
                  {role.name} ({staffCount})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">スタッフ一覧</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedRole ? `${getRoleInfo(selectedRole).name}` : '全役割'} - {filteredStaff.length}人のスタッフ
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
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">スタッフがいません</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedRole ? 'この役割のスタッフはいません。' : '新しいスタッフを追加して始めましょう。'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">名前</th>
                    <th className="table-header-cell">役割</th>
                    <th className="table-header-cell">メールアドレス</th>
                    <th className="table-header-cell">状態</th>
                    <th className="table-header-cell">登録日</th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredStaff.map((staff) => {
                    const roleInfo = getRoleInfo(staff.role);
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
                          <span className={`badge ${roleInfo.color}`} title={roleInfo.description}>
                            {roleInfo.name}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">{staff.email}</div>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`badge ${
                              staff.active
                                ? "badge-success"
                                : "badge-danger"
                            }`}
                          >
                            <svg className={`mr-1.5 h-2 w-2 ${staff.active ? 'text-green-400' : 'text-red-400'}`} fill="currentColor" viewBox="0 0 8 8">
                              <circle cx={4} cy={4} r={3} />
                            </svg>
                            {staff.active ? "在籍中" : "退職済み"}
                          </span>
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
          }}
          title="スタッフ情報の編集"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditStaff(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name || ""}
                  onChange={handleInputChange}
                  className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="スタッフ名を入力"
                  required
                />
                {validationErrors.name && (
                  <p className="form-error">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">
                  役割 <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={editFormData.role || ""}
                  onChange={handleInputChange}
                  className={`form-select mt-1 ${validationErrors.role ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
                {validationErrors.role && (
                  <p className="form-error">{validationErrors.role}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="form-label">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={editFormData.email || ""}
                onChange={handleInputChange}
                className={`form-input mt-1 ${validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="example@company.com"
                required
              />
              {validationErrors.email && (
                <p className="form-error">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={editFormData.active}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setEditFormData({
                    ...editFormData,
                    active: e.target.checked,
                  })
                }
                className="form-checkbox"
              />
              <label className="ml-2 block text-sm text-gray-900">
                在籍中（チェックを外すと退職済みになります）
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setValidationErrors({});
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
          message={`「${selectedStaff?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
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
          }}
          title="新しいスタッフの追加"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddStaff(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={addFormData.name || ""}
                  onChange={handleAddStaffInputChange}
                  className={`form-input mt-1 ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="スタッフ名を入力"
                  required
                />
                {validationErrors.name && (
                  <p className="form-error">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">
                  役割 <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={addFormData.role || ""}
                  onChange={handleAddStaffInputChange}
                  className={`form-select mt-1 ${validationErrors.role ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
                {validationErrors.role && (
                  <p className="form-error">{validationErrors.role}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="form-label">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={addFormData.email || ""}
                onChange={handleAddStaffInputChange}
                className={`form-input mt-1 ${validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="example@company.com"
                required
              />
              {validationErrors.email && (
                <p className="form-error">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={addFormData.active}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setAddFormData({
                    ...addFormData,
                    active: e.target.checked,
                  })
                }
                className="form-checkbox"
              />
              <label className="ml-2 block text-sm text-gray-900">
                在籍中（通常はチェックしたままにしてください）
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setValidationErrors({});
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