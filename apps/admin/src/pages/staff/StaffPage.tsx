import { Button } from "@table-order-system/ui";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { getStaffMembers, updateStaffMember, deleteStaffMember, createStaffMember } from "../../services/staffService";

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
};

const StaffPage = () => {
  const navigate = useNavigate();

  // 役割データ（固定値）
  const [roles] = useState<Role[]>([
    { id: "admin", name: "管理者" },
    { id: "manager", name: "マネージャー" },
    { id: "staff", name: "一般スタッフ" },
    { id: "kitchen", name: "キッチンスタッフ" },
  ]);

  // スタッフデータ（APIから取得）
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 選択中の役割
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // APIからスタッフデータを取得
  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStaffMembers();
      if (response.success) {
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

  // 役割名を取得する関数
  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "不明な役割";
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editFormData, setEditFormData] = useState<Staff>({
    id: 0,
    name: "",
    role: "staff",
    email: "",
    active: true,
  });
  
  const [addFormData, setAddFormData] = useState<Omit<Staff, "id">>({
    name: "",
    role: roles.length > 0 ? roles[0].id : "",
    email: "",
    phone: "",
    isActive: true,
  });
  
  const [addRoleData, setAddRoleData] = useState<Omit<Role, "id">>({
    name: "",
  });

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const handleOpenEditModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditFormData({ ...staff });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (staff: Staff) => {
    setSelectedStaff(staff);
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
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
      });
    }
  };

  const handleEditStaff = async () => {
    try {
      const result = await updateStaffMember(editFormData.id.toString(), editFormData);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchStaff();
        
        setIsEditModalOpen(false);
        setSelectedStaff(null);
      } else {
        setError('スタッフの更新に失敗しました');
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
        // データを再取得してリストを更新
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
  
  const handleAddRoleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddRoleData({
      ...addRoleData,
      [name]: value,
    });
  };
  
  const handleAddRole = async () => {
    try {
      // 現在は役割は固定値として管理されているため、実装は不要
      // 将来的に役割をDBで管理する場合はここで実装
      
      setAddRoleData({ name: "" });
      setIsAddRoleModalOpen(false);
    } catch (error) {
      console.error("役割の追加に失敗しました", error);
    }
  };
  
  const handleAddStaffInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  };
  
  const handleAddStaff = async () => {
    try {
      const result = await createStaffMember(addFormData);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchStaff();
        
        setAddFormData({
          name: "",
          role: "staff",
          email: "",
          active: true,
        });
        setIsAddModalOpen(false);
      } else {
        setError('スタッフの追加に失敗しました');
      }
    } catch (error) {
      console.error("スタッフの追加に失敗しました", error);
      setError('スタッフの追加中にエラーが発生しました');
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">スタッフ管理</h2>
        <Button
          label="ダッシュボードに戻る"
          variant="secondary"
          onClick={handleBack}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">役割別フィルター</h3>
          <Button 
            label="役割追加" 
            variant="secondary" 
            onClick={() => setIsAddRoleModalOpen(true)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-full ${
              selectedRole === null
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setSelectedRole(null)}
          >
            すべて
          </button>

          {roles.map((role) => (
            <button
              key={role.id}
              className={`px-4 py-2 rounded-full ${
                selectedRole === role.id
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              {role.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">スタッフ一覧</h3>
          <Button 
            label="スタッフ追加" 
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
            <p className="mt-2">スタッフデータを読み込み中...</p>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  役割
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メールアドレス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  電話番号
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
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {staff.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getRoleName(staff.role)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{staff.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">-</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          staff.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {staff.active ? "在籍中" : "退職済み"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary-dark mr-3"
                        onClick={() => handleOpenEditModal(staff)}
                      >
                        編集
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleOpenDeleteDialog(staff)}
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
                    表示するスタッフがありません
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
          title="スタッフ情報の編集"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleEditStaff(); }}>
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
                  役割
                </label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  在籍中
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
                onClick={handleEditStaff}
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
          onConfirm={handleDeleteStaff}
          title="スタッフの削除"
          message={`「${selectedStaff?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
        />
      )}

      {/* スタッフ追加モーダル */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="スタッフの追加"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleAddStaff(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  value={addFormData.name}
                  onChange={handleAddStaffInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  役割
                </label>
                <select
                  name="role"
                  value={addFormData.role}
                  onChange={handleAddStaffInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  name="email"
                  value={addFormData.email}
                  onChange={handleAddStaffInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  在籍中
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
                onClick={handleAddStaff}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* 役割追加モーダル */}
      {isAddRoleModalOpen && (
        <Modal
          isOpen={isAddRoleModalOpen}
          onClose={() => setIsAddRoleModalOpen(false)}
          title="役割の追加"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleAddRole(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  役割名
                </label>
                <input
                  type="text"
                  name="name"
                  value={addRoleData.name}
                  onChange={handleAddRoleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
              <Button
                label="キャンセル"
                variant="secondary"
                onClick={() => setIsAddRoleModalOpen(false)}
              />
              <Button
                label="追加"
                onClick={handleAddRole}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StaffPage;
