import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { 
  getStaffMembers, 
  updateStaffMember, 
  deleteStaffMember, 
  createStaffMember,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  Role,
  CreateRoleData
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

  // 役割データ（APIから取得）
  const [roles, setRoles] = useState<Role[]>([]);

  // スタッフデータ（APIから取得）
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 選択中の役割（フィルター用）
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  // 役割管理のモーダル状態
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

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

  // 役割フォームデータ
  const [addRoleFormData, setAddRoleFormData] = useState<CreateRoleData>({
    name: "",
    description: "",
    color: "bg-blue-100 text-blue-800"
  });
  
  const [editRoleFormData, setEditRoleFormData] = useState<CreateRoleData>({
    name: "",
    description: "",
    color: "bg-blue-100 text-blue-800"
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

  // APIから役割データを取得
  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      if (response.success && response.data) {
        setRoles(response.data);
      } else {
        // APIから取得できない場合は、デフォルトの役割を設定
        setRoles([
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
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      // エラーの場合もデフォルトの役割を設定
      setRoles([
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
    }
  };

  // 初回ロード時にデータを取得
  useEffect(() => {
    const initializeData = async () => {
      await fetchRoles();
      await fetchStaff();
    };
    
    initializeData();
  }, []);

  // フィルタリングされたスタッフリスト
  const filteredStaff = selectedRoleFilter
    ? staffList.filter((staff) => staff.role === selectedRoleFilter)
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
  const validateForm = (data: Omit<Staff, "id"> | Staff, isAddForm: boolean = false): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = "名前を入力してください";
    } else if (data.name.trim().length < 2) {
      errors.name = "名前は2文字以上で入力してください";
    }

    if (!data.loginId.trim()) {
      errors.loginId = "ログインIDを入力してください";
    } else if (data.loginId.trim().length < 3) {
      errors.loginId = "ログインIDは3文字以上で入力してください";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.loginId.trim())) {
      errors.loginId = "ログインIDは英数字、ハイフン、アンダースコアのみ使用できます";
    }

    // パスワードのバリデーション（追加フォームの場合のみ）
    if (isAddForm && 'password' in data) {
      const passwordData = data as Omit<Staff, "id"> & { password: string };
      if (!passwordData.password.trim()) {
        errors.password = "パスワードを入力してください";
      } else if (passwordData.password.trim().length < 6) {
        errors.password = "パスワードは6文字以上で入力してください";
      }
    }

    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
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
        email: editFormData.email.trim() || undefined,
        phone: editFormData.phone?.trim() || undefined,
        active: editFormData.active
      };

      const result = await updateStaffMember(editFormData.id.toString(), updateData);
      
      if (result.success) {
        await fetchStaff();
        setIsEditModalOpen(false);
        setSelectedStaff(null);
        setValidationErrors({});
      } else {
        // エラーがオブジェクトの場合は文字列に変換
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : 'スタッフの更新に失敗しました';
        setError(errorMessage);
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
    if (!validateForm(addFormData, true)) {
      return;
    }

    try {
      setError(null);
      
      // デバッグ用: 認証情報を確認
      const createData = {
        name: addFormData.name.trim(),
        loginId: addFormData.loginId.trim(),
        password: addFormData.password.trim(),
        role: addFormData.role,
        email: addFormData.email.trim() || undefined,
        phone: addFormData.phone.trim() || undefined,
        active: addFormData.active
      };

      const result = await createStaffMember(createData);


      if (result.success) {
        await fetchStaff();
        setAddFormData({
          name: "",
          loginId: "",
          password: "",
          role: "staff",
          email: "",
          phone: "",
          active: true,
        });
        setIsAddModalOpen(false);
        setValidationErrors({});
      } else {
        // エラーがオブジェクトの場合は文字列に変換
        let errorMessage = 'スタッフの追加に失敗しました';
        
        if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (result.error && result.error.issues && result.error.issues.length > 0) {
          // Zodエラーの場合
          errorMessage = result.error.issues[0].message || 'バリデーションエラーが発生しました';
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error("スタッフの追加に失敗しました", error);
      setError('スタッフの追加中にエラーが発生しました');
    }
  };

  // 役割管理の関数
  const handleOpenRoleModal = (role: Role) => {
    setSelectedRole(role);
    setEditRoleFormData({
      name: role.name,
      description: role.description,
      color: role.color
    });
    setError(null);
    setValidationErrors({});
    setIsEditRoleModalOpen(true);
  };

  const handleOpenDeleteRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteRoleDialogOpen(true);
  };

  const handleRoleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (isEditRoleModalOpen) {
      setEditRoleFormData({
        ...editRoleFormData,
        [name]: value,
      });
    } else {
      setAddRoleFormData({
        ...addRoleFormData,
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

  const validateRoleForm = (data: CreateRoleData): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = "役割名を入力してください";
    } else if (data.name.trim().length < 2) {
      errors.name = "役割名は2文字以上で入力してください";
    }

    if (!data.description.trim()) {
      errors.description = "説明を入力してください";
    }

    if (!data.color) {
      errors.color = "色を選択してください";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRole = async () => {
    if (!validateRoleForm(addRoleFormData)) {
      return;
    }

    try {
      setError(null);
      const createData = {
        name: addRoleFormData.name.trim(),
        description: addRoleFormData.description.trim(),
        color: addRoleFormData.color
      };

      const result = await createRole(createData);
      
      if (result.success) {
        await fetchRoles();
        setAddRoleFormData({
          name: "",
          description: "",
          color: "bg-blue-100 text-blue-800"
        });
        setIsAddRoleModalOpen(false);
        setValidationErrors({});
      } else {
        setError(result.error || '役割の追加に失敗しました');
      }
    } catch (error) {
      console.error("役割の追加に失敗しました", error);
      setError('役割の追加中にエラーが発生しました');
    }
  };

  const handleEditRole = async () => {
    if (!validateRoleForm(editRoleFormData) || !selectedRole) {
      return;
    }

    try {
      setError(null);
      const updateData = {
        name: editRoleFormData.name.trim(),
        description: editRoleFormData.description.trim(),
        color: editRoleFormData.color
      };

      const result = await updateRole(selectedRole.id, updateData);
      
      if (result.success) {
        await fetchRoles();
        setIsEditRoleModalOpen(false);
        setSelectedRole(null);
        setValidationErrors({});
      } else {
        setError(result.error || '役割の更新に失敗しました');
      }
    } catch (error) {
      console.error("役割の更新に失敗しました", error);
      setError('役割の更新中にエラーが発生しました');
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    // この役割を使用しているスタッフがいないかチェック
    const staffUsingRole = staffList.filter(staff => staff.role === selectedRole.id);
    if (staffUsingRole.length > 0) {
      setError(`この役割は${staffUsingRole.length}人のスタッフが使用中のため削除できません`);
      setIsDeleteRoleDialogOpen(false);
      return;
    }
    
    try {
      const result = await deleteRole(selectedRole.id);
      
      if (result.success) {
        await fetchRoles();
        setIsDeleteRoleDialogOpen(false);
        setSelectedRole(null);
      } else {
        setError('役割の削除に失敗しました');
      }
    } catch (error) {
      console.error("役割の削除に失敗しました", error);
      setError('役割の削除中にエラーが発生しました');
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
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                スタッフを役割別に表示・管理
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setValidationErrors({});
                  setIsRoleManagementOpen(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                役割管理
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedRoleFilter === null
                  ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedRoleFilter(null)}
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
                    selectedRoleFilter === role.id
                      ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedRoleFilter(role.id)}
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
                {selectedRoleFilter ? `${getRoleInfo(selectedRoleFilter).name}` : '全役割'} - {filteredStaff.length}人のスタッフ
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
                {selectedRoleFilter ? 'この役割のスタッフはいません。' : '新しいスタッフを追加して始めましょう。'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">名前</th>
                    <th className="table-header-cell">ログインID</th>
                    <th className="table-header-cell">役割</th>
                    <th className="table-header-cell">連絡先</th>
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
                          <div className="text-sm font-medium text-gray-700">{staff.loginId}</div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${roleInfo.color}`} title={roleInfo.description}>
                            {roleInfo.name}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">
                            {staff.email && <div>{staff.email}</div>}
                            {staff.phone && <div>{staff.phone}</div>}
                            {!staff.email && !staff.phone && <span className="text-gray-400">-</span>}
                          </div>
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
                  ログインID
                </label>
                <input
                  type="text"
                  name="loginId"
                  value={editFormData.loginId || ""}
                  readOnly
                  className="form-input mt-1 bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="ログインIDは変更できません"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ログインIDは編集できません
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-yellow-800">
                  パスワードはこのフォームから変更できません。パスワード変更が必要な場合は、管理者にお問い合わせください。
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                value={editFormData.email || ""}
                onChange={handleInputChange}
                className={`form-input mt-1 ${validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="example@company.com (任意)"
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
                  ログインID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="loginId"
                  value={addFormData.loginId || ""}
                  onChange={handleAddStaffInputChange}
                  className={`form-input mt-1 ${validationErrors.loginId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="ログインIDを入力（英数字、-、_のみ）"
                  required
                />
                {validationErrors.loginId && (
                  <p className="form-error">{validationErrors.loginId}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  ログイン時に使用するIDです（3文字以上、英数字・ハイフン・アンダースコアのみ）
                </p>
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
                onChange={handleAddStaffInputChange}
                className={`form-input mt-1 ${validationErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="パスワードを入力（6文字以上）"
                required
              />
              {validationErrors.password && (
                <p className="form-error">{validationErrors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                ログイン時に使用するパスワードです（6文字以上）
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                value={addFormData.email || ""}
                onChange={handleAddStaffInputChange}
                className={`form-input mt-1 ${validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="example@company.com (任意)"
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

      {/* 役割管理モーダル */}
      {isRoleManagementOpen && (
        <Modal
          isOpen={isRoleManagementOpen}
          onClose={() => setIsRoleManagementOpen(false)}
          title="役割管理"
          size="xl"
        >
          <div className="space-y-8">
            {/* ヘッダーセクション */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">組織の役割管理</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      役割を追加、編集、削除して組織に最適化
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500">
                    合計 <span className="font-semibold text-gray-900">{roles.length}</span> の役割
                  </div>
                  <button
                    onClick={() => {
                      setError(null);
                      setValidationErrors({});
                      setIsAddRoleModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    新しい役割
                  </button>
                </div>
              </div>
            </div>

            {/* 役割一覧セクション */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">登録済み役割</h4>
                      <p className="text-sm text-gray-500">現在の組織で使用されている役割</p>
                    </div>
                  </div>
                </div>

                {roles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-gray-100 rounded-full p-6 mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">役割が登録されていません</h3>
                    <p className="text-gray-500 mb-6 text-center max-w-sm">
                      組織に必要な役割を追加して、スタッフ管理を始めましょう
                    </p>
                    <button
                      onClick={() => {
                        setError(null);
                        setValidationErrors({});
                        setIsAddRoleModalOpen(true);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      最初の役割を追加
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {roles.map((role) => {
                        const staffCount = staffList.filter(staff => staff.role === role.id).length;
                        return (
                          <div key={role.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group">
                            {/* 役割ヘッダー */}
                            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <span className={`inline-block w-3 h-3 rounded-full mr-3 ${role.color.replace('text-', 'bg-').replace('100', '500')}`}></span>
                                  <h5 className="text-lg font-semibold text-gray-900">{role.name}</h5>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-600">{staffCount}人</span>
                                </div>
                              </div>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${role.color.replace('text-', 'bg-').replace('100', '500')}`}></span>
                                {staffCount > 0 ? `${staffCount}人が使用中` : '未使用'}
                              </div>
                            </div>

                            {/* 役割詳細 */}
                            <div className="p-5">
                              <p className="text-gray-600 text-sm leading-relaxed mb-4 min-h-[3rem]">
                                {role.description}
                              </p>

                              {/* アクションボタン */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleOpenRoleModal(role)}
                                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  編集
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteRoleDialog(role)}
                                  disabled={staffCount > 0}
                                  className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    staffCount > 0
                                      ? 'border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                                      : 'border border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                  }`}
                                  title={staffCount > 0 ? 'この役割を使用中のスタッフがいるため削除できません' : ''}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 役割追加モーダル */}
      {isAddRoleModalOpen && (
        <Modal
          isOpen={isAddRoleModalOpen}
          onClose={() => {
            setIsAddRoleModalOpen(false);
            setValidationErrors({});
          }}
          title="新しい役割の追加"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddRole(); }} className="space-y-8">
            {/* ヘッダーセクション */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">新しい役割を作成</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    組織に最適な役割を定義して、スタッフ管理を効率化
                  </p>
                </div>
              </div>
            </div>

            {/* 基本情報セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                基本情報
              </h4>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役割名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={addRoleFormData.name}
                    onChange={handleRoleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="例: マネージャー補佐、シェフ、バリスタ"
                    required
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役割の説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={addRoleFormData.description}
                    onChange={handleRoleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${validationErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="この役割の責任範囲、主な業務、権限について詳しく説明してください..."
                    required
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    スタッフがこの役割を理解しやすいよう、具体的に記述してください
                  </p>
                </div>
              </div>
            </div>

            {/* 表示設定セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21a4 4 0 004-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4M7 21a4 4 0 004-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4" />
                </svg>
                表示設定
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  識別色 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: "bg-blue-100 text-blue-800", name: "青色", color: "bg-blue-500" },
                    { value: "bg-green-100 text-green-800", name: "緑色", color: "bg-green-500" },
                    { value: "bg-yellow-100 text-yellow-800", name: "黄色", color: "bg-yellow-500" },
                    { value: "bg-red-100 text-red-800", name: "赤色", color: "bg-red-500" },
                    { value: "bg-purple-100 text-purple-800", name: "紫色", color: "bg-purple-500" },
                    { value: "bg-pink-100 text-pink-800", name: "ピンク色", color: "bg-pink-500" },
                    { value: "bg-indigo-100 text-indigo-800", name: "インディゴ色", color: "bg-indigo-500" },
                    { value: "bg-gray-100 text-gray-800", name: "グレー色", color: "bg-gray-500" },
                  ].map((colorOption) => (
                    <label key={colorOption.value} className="relative">
                      <input
                        type="radio"
                        name="color"
                        value={colorOption.value}
                        checked={addRoleFormData.color === colorOption.value}
                        onChange={handleRoleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        addRoleFormData.color === colorOption.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full ${colorOption.color}`}></span>
                          <span className="text-sm font-medium text-gray-700">{colorOption.name}</span>
                        </div>
                        {addRoleFormData.color === colorOption.value && (
                          <div className="absolute top-1 right-1">
                            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {validationErrors.color && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.color}</p>
                )}
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                onClick={() => {
                  setIsAddRoleModalOpen(false);
                  setValidationErrors({});
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                役割を追加
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 役割編集モーダル */}
      {isEditRoleModalOpen && (
        <Modal
          isOpen={isEditRoleModalOpen}
          onClose={() => {
            setIsEditRoleModalOpen(false);
            setValidationErrors({});
          }}
          title="役割の編集"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditRole(); }} className="space-y-8">
            {/* ヘッダーセクション */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">役割を編集</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    役割の詳細を更新して、組織の変化に対応
                  </p>
                </div>
              </div>
            </div>

            {/* 基本情報セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                基本情報
              </h4>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役割名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editRoleFormData.name}
                    onChange={handleRoleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${validationErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="例: マネージャー補佐、シェフ、バリスタ"
                    required
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役割の説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={editRoleFormData.description}
                    onChange={handleRoleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${validationErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="この役割の責任範囲、主な業務、権限について詳しく説明してください..."
                    required
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    スタッフがこの役割を理解しやすいよう、具体的に記述してください
                  </p>
                </div>
              </div>
            </div>

            {/* 表示設定セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21a4 4 0 004-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4M7 21a4 4 0 004-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4" />
                </svg>
                表示設定
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  識別色 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: "bg-blue-100 text-blue-800", name: "青色", color: "bg-blue-500" },
                    { value: "bg-green-100 text-green-800", name: "緑色", color: "bg-green-500" },
                    { value: "bg-yellow-100 text-yellow-800", name: "黄色", color: "bg-yellow-500" },
                    { value: "bg-red-100 text-red-800", name: "赤色", color: "bg-red-500" },
                    { value: "bg-purple-100 text-purple-800", name: "紫色", color: "bg-purple-500" },
                    { value: "bg-pink-100 text-pink-800", name: "ピンク色", color: "bg-pink-500" },
                    { value: "bg-indigo-100 text-indigo-800", name: "インディゴ色", color: "bg-indigo-500" },
                    { value: "bg-gray-100 text-gray-800", name: "グレー色", color: "bg-gray-500" },
                  ].map((colorOption) => (
                    <label key={colorOption.value} className="relative">
                      <input
                        type="radio"
                        name="color"
                        value={colorOption.value}
                        checked={editRoleFormData.color === colorOption.value}
                        onChange={handleRoleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        editRoleFormData.color === colorOption.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-full ${colorOption.color}`}></span>
                          <span className="text-sm font-medium text-gray-700">{colorOption.name}</span>
                        </div>
                        {editRoleFormData.color === colorOption.value && (
                          <div className="absolute top-1 right-1">
                            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {validationErrors.color && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.color}</p>
                )}
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                onClick={() => {
                  setIsEditRoleModalOpen(false);
                  setValidationErrors({});
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                変更を保存
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 役割削除確認ダイアログ */}
      {isDeleteRoleDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteRoleDialogOpen}
          onClose={() => setIsDeleteRoleDialogOpen(false)}
          onConfirm={handleDeleteRole}
          title="役割の削除"
          message={`「${selectedRole?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
          confirmText="削除"
          variant="danger"
        />
      )}
    </div>
  );
};

export default StaffPage;