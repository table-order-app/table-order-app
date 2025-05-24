import { Button } from "@table-order-system/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { updateTable, deleteTable } from "../../services/tableService";

// テーブルの型定義
type Table = {
  id: string;
  number: number;
  capacity: number;
  area: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
};

// エリアの型定義
type Area = {
  id: string;
  name: string;
};

const TablesPage = () => {
  const navigate = useNavigate();

  // サンプルエリアデータ
  const [areas, setAreas] = useState<Area[]>([
    { id: "area1", name: "メインフロア" },
    { id: "area2", name: "テラス" },
    { id: "area3", name: "個室" },
    { id: "area4", name: "カウンター" },
  ]);

  // サンプルテーブルデータ
  const [tables, setTables] = useState<Table[]>([
    {
      id: "table1",
      number: 1,
      capacity: 4,
      area: "area1",
      status: "available",
    },
    {
      id: "table2",
      number: 2,
      capacity: 2,
      area: "area1",
      status: "occupied",
    },
    {
      id: "table3",
      number: 3,
      capacity: 6,
      area: "area2",
      status: "available",
    },
    {
      id: "table4",
      number: 101,
      capacity: 8,
      area: "area3",
      status: "reserved",
    },
    {
      id: "table5",
      number: 201,
      capacity: 1,
      area: "area4",
      status: "maintenance",
    },
  ]);

  // 選択中のエリア
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // フィルタリングされたテーブルリスト
  const filteredTables = selectedArea
    ? tables.filter((table) => table.area === selectedArea)
    : tables;

  // エリア名を取得する関数
  const getAreaName = (areaId: string) => {
    const area = areas.find((a) => a.id === areaId);
    return area ? area.name : "不明なエリア";
  };

  // ステータスの日本語表示を取得する関数
  const getStatusDisplay = (status: Table["status"]) => {
    const statusMap = {
      available: "利用可能",
      occupied: "使用中",
      reserved: "予約済み",
      maintenance: "メンテナンス中",
    };
    return statusMap[status];
  };

  // ステータスの色を取得する関数
  const getStatusColor = (status: Table["status"]) => {
    const colorMap = {
      available: "bg-green-100 text-green-800",
      occupied: "bg-red-100 text-red-800",
      reserved: "bg-yellow-100 text-yellow-800",
      maintenance: "bg-gray-100 text-gray-800",
    };
    return colorMap[status];
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editFormData, setEditFormData] = useState<Table>({
    id: "",
    number: 0,
    capacity: 0,
    area: "",
    status: "available",
  });
  
  const [addFormData, setAddFormData] = useState<Omit<Table, "id">>({
    number: 0,
    capacity: 0,
    area: areas.length > 0 ? areas[0].id : "",
    status: "available",
  });
  
  const [addAreaData, setAddAreaData] = useState<Omit<Area, "id">>({
    name: "",
  });

  const handleAddAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddAreaData({
      ...addAreaData,
      [name]: value,
    });
  };
  
  const handleAddArea = async () => {
    try {
      
      const newId = `area${Date.now()}`;
      
      const newArea = {
        id: newId,
        name: addAreaData.name,
      };
      
      setAreas([...areas, newArea]);
      
      setAddAreaData({ name: "" });
      setIsAddAreaModalOpen(false);
    } catch (error) {
      console.error("エリアの追加に失敗しました", error);
    }
  };
  
  const handleAddTableInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number' || name === 'capacity') {
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
  
  const handleAddTable = async () => {
    try {
      // const result = await createTable(addFormData);
      
      const newId = `table${Date.now()}`;
      
      const newTable = {
        id: newId,
        ...addFormData,
      };
      
      setTables([...tables, newTable]);
      
      setAddFormData({
        number: 0,
        capacity: 0,
        area: areas.length > 0 ? areas[0].id : "",
        status: "available",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("テーブルの追加に失敗しました", error);
    }
  };

  const handleOpenEditModal = (table: Table) => {
    setSelectedTable(table);
    setEditFormData({ ...table });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (table: Table) => {
    setSelectedTable(table);
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
    } else if (name === 'number' || name === 'capacity') {
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

  const handleEditTable = async () => {
    try {
      await updateTable(editFormData.id, editFormData);
      
      const updatedTables = tables.map((table) => 
        table.id === editFormData.id ? editFormData : table
      );
      setTables(updatedTables);
      
      setIsEditModalOpen(false);
      setSelectedTable(null);
    } catch (error) {
      console.error("テーブルの更新に失敗しました", error);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    
    try {
      await deleteTable(selectedTable.id);
      
      const updatedTables = tables.filter((table) => table.id !== selectedTable.id);
      setTables(updatedTables);
      
      setIsDeleteDialogOpen(false);
      setSelectedTable(null);
    } catch (error) {
      console.error("テーブルの削除に失敗しました", error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">テーブル設定</h2>
        <Button
          label="ダッシュボードに戻る"
          variant="secondary"
          onClick={handleBack}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">エリア別フィルター</h3>
          <Button 
            label="エリア追加" 
            variant="secondary" 
            onClick={() => setIsAddAreaModalOpen(true)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-full ${
              selectedArea === null
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setSelectedArea(null)}
          >
            すべて
          </button>

          {areas.map((area) => (
            <button
              key={area.id}
              className={`px-4 py-2 rounded-full ${
                selectedArea === area.id
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setSelectedArea(area.id)}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">テーブル一覧</h3>
          <Button 
            label="テーブル追加" 
            onClick={() => setIsAddModalOpen(true)}
          />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  テーブル番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  収容人数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  エリア
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
              {filteredTables.length > 0 ? (
                filteredTables.map((table) => (
                  <tr key={table.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {table.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {table.capacity}人
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getAreaName(table.area)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          table.status
                        )}`}
                      >
                        {getStatusDisplay(table.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary-dark mr-3"
                        onClick={() => handleOpenEditModal(table)}
                      >
                        編集
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleOpenDeleteDialog(table)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    表示するテーブルがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-lg mb-2">テーブル状態の説明</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                利用可能
              </span>
              <span className="text-sm text-gray-700">注文可能な状態</span>
            </div>
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 mr-2">
                使用中
              </span>
              <span className="text-sm text-gray-700">現在お客様が利用中</span>
            </div>
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
                予約済み
              </span>
              <span className="text-sm text-gray-700">
                予約が入っている状態
              </span>
            </div>
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                メンテナンス中
              </span>
              <span className="text-sm text-gray-700">使用不可の状態</span>
            </div>
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="テーブル情報の編集"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditTable(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  テーブル番号
                </label>
                <input
                  type="number"
                  name="number"
                  value={editFormData.number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  収容人数
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={editFormData.capacity}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  エリア
                </label>
                <select
                  name="area"
                  value={editFormData.area}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  状態
                </label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="available">利用可能</option>
                  <option value="occupied">使用中</option>
                  <option value="reserved">予約済み</option>
                  <option value="maintenance">メンテナンス中</option>
                </select>
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
                onClick={handleEditTable}
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
          onConfirm={handleDeleteTable}
          title="テーブルの削除"
          message={`テーブル番号「${selectedTable?.number}」を削除してもよろしいですか？この操作は元に戻せません。`}
        />
      )}

      {/* テーブル追加モーダル */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="テーブルの追加"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddTable(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  テーブル番号
                </label>
                <input
                  type="number"
                  name="number"
                  value={addFormData.number}
                  onChange={handleAddTableInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  収容人数
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={addFormData.capacity}
                  onChange={handleAddTableInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  エリア
                </label>
                <select
                  name="area"
                  value={addFormData.area}
                  onChange={handleAddTableInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  状態
                </label>
                <select
                  name="status"
                  value={addFormData.status}
                  onChange={handleAddTableInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="available">利用可能</option>
                  <option value="occupied">使用中</option>
                  <option value="reserved">予約済み</option>
                  <option value="maintenance">メンテナンス中</option>
                </select>
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
                onClick={handleAddTable}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* エリア追加モーダル */}
      {isAddAreaModalOpen && (
        <Modal
          isOpen={isAddAreaModalOpen}
          onClose={() => setIsAddAreaModalOpen(false)}
          title="エリアの追加"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddArea(); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  エリア名
                </label>
                <input
                  type="text"
                  name="name"
                  value={addAreaData.name}
                  onChange={handleAddAreaInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
              <Button
                label="キャンセル"
                variant="secondary"
                onClick={() => setIsAddAreaModalOpen(false)}
              />
              <Button
                label="追加"
                onClick={handleAddArea}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TablesPage;
