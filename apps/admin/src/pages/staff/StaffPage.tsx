import { Button } from "@table-order-system/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";

// スタッフの型定義
type Staff = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
};

// 役割の型定義
type Role = {
  id: string;
  name: string;
};

const StaffPage = () => {
  const navigate = useNavigate();

  // サンプル役割データ
  const [roles] = useState<Role[]>([
    { id: "role1", name: "店長" },
    { id: "role2", name: "ホールスタッフ" },
    { id: "role3", name: "キッチンスタッフ" },
    { id: "role4", name: "アルバイト" },
  ]);

  // サンプルスタッフデータ
  const [staffList] = useState<Staff[]>([
    {
      id: "staff1",
      name: "山田太郎",
      role: "role1",
      email: "yamada@example.com",
      phone: "090-1234-5678",
      isActive: true,
    },
    {
      id: "staff2",
      name: "佐藤花子",
      role: "role2",
      email: "sato@example.com",
      phone: "090-8765-4321",
      isActive: true,
    },
    {
      id: "staff3",
      name: "鈴木一郎",
      role: "role3",
      email: "suzuki@example.com",
      phone: "090-2468-1357",
      isActive: true,
    },
    {
      id: "staff4",
      name: "高橋真理",
      role: "role4",
      email: "takahashi@example.com",
      phone: "090-1357-2468",
      isActive: false,
    },
  ]);

  // 選択中の役割
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // フィルタリングされたスタッフリスト
  const filteredStaff = selectedRole
    ? staffList.filter((staff) => staff.role === selectedRole)
    : staffList;

  // 役割名を取得する関数
  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "不明な役割";
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
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
          <Button label="役割追加" variant="secondary" />
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
          <Button label="スタッフ追加" />
        </div>

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
                      <div className="text-sm text-gray-900">{staff.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          staff.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {staff.isActive ? "在籍中" : "退職済み"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary hover:text-primary-dark mr-3">
                        編集
                      </button>
                      <button className="text-red-600 hover:text-red-900">
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
    </div>
  );
};

export default StaffPage;
