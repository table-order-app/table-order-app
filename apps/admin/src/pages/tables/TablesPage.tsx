import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { getTables, createTable, updateTable, deleteTable } from "../../services/tableService";

// テーブルの型定義
type Table = {
  id: number;
  number: number;
  capacity: number;
  area: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  qrCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// エリアの型定義
type Area = {
  id: string;
  name: string;
  color: string;
  description: string;
};

// ステータスの型定義
type Status = {
  id: "available" | "occupied" | "reserved" | "maintenance";
  name: string;
  color: string;
  description: string;
};

const TablesPage = () => {
  const navigate = useNavigate();

  // エリアデータ（固定値として保持）
  const [areas] = useState<Area[]>([
    { 
      id: "main_floor", 
      name: "メインフロア", 
      color: "bg-blue-100 text-blue-800",
      description: "一般的なダイニングエリア"
    },
    { 
      id: "terrace", 
      name: "テラス", 
      color: "bg-green-100 text-green-800",
      description: "屋外席エリア"
    },
    { 
      id: "private_room", 
      name: "個室", 
      color: "bg-purple-100 text-purple-800",
      description: "プライベートダイニング"
    },
    { 
      id: "counter", 
      name: "カウンター", 
      color: "bg-orange-100 text-orange-800",
      description: "カウンター席エリア"
    },
  ]);

  // ステータスデータ（固定値）
  const [statuses] = useState<Status[]>([
    { 
      id: "available", 
      name: "利用可能", 
      color: "bg-green-100 text-green-800",
      description: "注文可能な状態"
    },
    { 
      id: "occupied", 
      name: "使用中", 
      color: "bg-red-100 text-red-800",
      description: "現在お客様が利用中"
    },
    { 
      id: "reserved", 
      name: "予約済み", 
      color: "bg-yellow-100 text-yellow-800",
      description: "予約が入っている状態"
    },
    { 
      id: "maintenance", 
      name: "メンテナンス中", 
      color: "bg-gray-100 text-gray-800",
      description: "使用不可の状態"
    },
  ]);

  // テーブルデータ（APIから取得）
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 選択中のエリア・ステータス
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // フォームデータ
  const [editFormData, setEditFormData] = useState<Table>({
    id: 0,
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

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // APIからテーブルデータを取得
  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTables();
      if (response.success && response.data) {
        setTables(response.data);
      } else {
        setError('テーブルデータの取得に失敗しました');
      }
    } catch (err) {
      setError('テーブルデータの取得中にエラーが発生しました');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時にテーブルデータを取得
  useEffect(() => {
    fetchTables();
  }, []);

  // フィルタリングされたテーブルリスト
  const filteredTables = tables.filter((table) => {
    if (selectedArea && table.area !== selectedArea) return false;
    if (selectedStatus && table.status !== selectedStatus) return false;
    return true;
  });

  // エリア情報を取得する関数
  const getAreaInfo = (areaId: string) => {
    return areas.find((a) => a.id === areaId) || { 
      name: "不明なエリア", 
      color: "bg-gray-100 text-gray-800",
      description: ""
    };
  };

  // ステータス情報を取得する関数
  const getStatusInfo = (statusId: string) => {
    return statuses.find((s) => s.id === statusId) || { 
      name: "不明な状態", 
      color: "bg-gray-100 text-gray-800",
      description: ""
    };
  };

  // バリデーション関数
  const validateForm = (data: Omit<Table, "id"> | Table): boolean => {
    const errors: Record<string, string> = {};

    if (!data.number || data.number <= 0) {
      errors.number = "テーブル番号は1以上の数値を入力してください";
    }

    if (!data.capacity || data.capacity <= 0) {
      errors.capacity = "収容人数は1以上の数値を入力してください";
    }

    if (!data.area) {
      errors.area = "エリアを選択してください";
    }

    if (!data.status) {
      errors.status = "状態を選択してください";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const handleOpenEditModal = (table: Table) => {
    setSelectedTable(table);
    setEditFormData({ ...table });
    setError(null);
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (table: Table) => {
    setSelectedTable(table);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number' || name === 'capacity') {
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

    // リアルタイムバリデーション
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };

  const handleEditTable = async () => {
    if (!validateForm(editFormData)) {
      return;
    }

    try {
      setError(null);
      const updateData = {
        number: editFormData.number,
        capacity: editFormData.capacity,
        area: editFormData.area,
        status: editFormData.status
      };

      const result = await updateTable(editFormData.id.toString(), updateData);
      
      if (result.success) {
        await fetchTables();
        setIsEditModalOpen(false);
        setSelectedTable(null);
        setValidationErrors({});
      } else {
        setError(result.error || 'テーブルの更新に失敗しました');
      }
    } catch (error) {
      console.error("テーブルの更新に失敗しました", error);
      setError('テーブルの更新中にエラーが発生しました');
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    
    try {
      const result = await deleteTable(selectedTable.id.toString());
      
      if (result.success) {
        await fetchTables();
        setIsDeleteDialogOpen(false);
        setSelectedTable(null);
      } else {
        setError('テーブルの削除に失敗しました');
      }
    } catch (error) {
      console.error("テーブルの削除に失敗しました", error);
      setError('テーブルの削除中にエラーが発生しました');
    }
  };
  
  const handleAddTableInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    // リアルタイムバリデーション
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
  };
  
  const handleAddTable = async () => {
    if (!validateForm(addFormData)) {
      return;
    }

    try {
      setError(null);
      const createData = {
        number: addFormData.number,
        capacity: addFormData.capacity,
        area: addFormData.area,
        status: addFormData.status
      };

      const result = await createTable(createData);
      
      if (result.success) {
        await fetchTables();
        setAddFormData({
          number: 0,
          capacity: 0,
          area: areas.length > 0 ? areas[0].id : "",
          status: "available",
        });
        setIsAddModalOpen(false);
        setValidationErrors({});
      } else {
        setError(result.error || 'テーブルの追加に失敗しました');
      }
    } catch (error) {
      console.error("テーブルの追加に失敗しました", error);
      setError('テーブルの追加中にエラーが発生しました');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">テーブル管理</h1>
          <p className="mt-2 text-sm text-gray-700">店舗のテーブル設定とレイアウト管理を行います</p>
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

      {/* Area Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">エリアフィルター</h3>
            <div className="text-sm text-gray-500">
              テーブルをエリア別に表示・管理
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedArea === null
                  ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedArea(null)}
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-3h6M7 21H5m2 0h6m6-18H7.5m.5 5v7" />
              </svg>
              すべて ({tables.length})
            </button>

            {areas.map((area) => {
              const areaCount = tables.filter(table => table.area === area.id).length;
              return (
                <button
                  key={area.id}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedArea === area.id
                      ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedArea(area.id)}
                  title={area.description}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${area.color.replace('text-', 'bg-').replace('100', '500')}`}></span>
                  {area.name} ({areaCount})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">ステータスフィルター</h3>
            <div className="text-sm text-gray-500">
              テーブルをステータス別に表示
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedStatus === null
                  ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedStatus(null)}
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              すべて ({tables.length})
            </button>

            {statuses.map((status) => {
              const statusCount = tables.filter(table => table.status === status.id).length;
              return (
                <button
                  key={status.id}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedStatus === status.id
                      ? "bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedStatus(status.id)}
                  title={status.description}
                >
                  <svg className={`mr-1.5 h-2 w-2 ${status.color.replace('bg-', 'text-').replace('100', '400')}`} fill="currentColor" viewBox="0 0 8 8">
                    <circle cx={4} cy={4} r={3} />
                  </svg>
                  {status.name} ({statusCount})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">テーブル一覧</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedArea && selectedStatus ? `${getAreaInfo(selectedArea).name} - ${getStatusInfo(selectedStatus).name}` : 
                 selectedArea ? getAreaInfo(selectedArea).name : 
                 selectedStatus ? getStatusInfo(selectedStatus).name : '全テーブル'} - {filteredTables.length}テーブル
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
              テーブル追加
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">テーブルデータを読み込み中...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-3h6M7 21H5m2 0h6m6-18H7.5m.5 5v7" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">テーブルがありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedArea || selectedStatus ? '条件に一致するテーブルがありません。' : '新しいテーブルを追加して始めましょう。'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">テーブル番号</th>
                    <th className="table-header-cell">収容人数</th>
                    <th className="table-header-cell">エリア</th>
                    <th className="table-header-cell">状態</th>
                    <th className="table-header-cell">登録日</th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredTables.map((table) => {
                    const areaInfo = getAreaInfo(table.area);
                    const statusInfo = getStatusInfo(table.status);
                    return (
                      <tr key={table.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-3h6M7 21H5m2 0h6m6-18H7.5m.5 5v7" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">テーブル {table.number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900">{table.capacity}人</div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${areaInfo.color}`} title={areaInfo.description}>
                            {areaInfo.name}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${statusInfo.color}`} title={statusInfo.description}>
                            <svg className={`mr-1.5 h-2 w-2 ${statusInfo.color.replace('bg-', 'text-').replace('100', '400')}`} fill="currentColor" viewBox="0 0 8 8">
                              <circle cx={4} cy={4} r={3} />
                            </svg>
                            {statusInfo.name}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-500">
                            {table.createdAt ? new Date(table.createdAt).toLocaleDateString('ja-JP') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors duration-200"
                              onClick={() => handleOpenEditModal(table)}
                            >
                              編集
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900 font-medium transition-colors duration-200"
                              onClick={() => handleOpenDeleteDialog(table)}
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
          title="テーブル情報の編集"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditTable(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  テーブル番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="number"
                  value={editFormData.number || ""}
                  onChange={handleInputChange}
                  className={`form-input mt-1 ${validationErrors.number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="1"
                  min="1"
                  required
                />
                {validationErrors.number && (
                  <p className="form-error">{validationErrors.number}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">
                  収容人数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={editFormData.capacity || ""}
                  onChange={handleInputChange}
                  className={`form-input mt-1 ${validationErrors.capacity ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="4"
                  min="1"
                  required
                />
                {validationErrors.capacity && (
                  <p className="form-error">{validationErrors.capacity}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="form-label">
                エリア <span className="text-red-500">*</span>
              </label>
              <select
                name="area"
                value={editFormData.area || ""}
                onChange={handleInputChange}
                className={`form-select mt-1 ${validationErrors.area ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} - {area.description}
                  </option>
                ))}
              </select>
              {validationErrors.area && (
                <p className="form-error">{validationErrors.area}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                状態 <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={editFormData.status || ""}
                onChange={handleInputChange}
                className={`form-select mt-1 ${validationErrors.status ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name} - {status.description}
                  </option>
                ))}
              </select>
              {validationErrors.status && (
                <p className="form-error">{validationErrors.status}</p>
              )}
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
          onConfirm={handleDeleteTable}
          title="テーブルの削除"
          message={`テーブル番号「${selectedTable?.number}」を削除してもよろしいですか？この操作は元に戻せません。`}
          confirmText="削除"
          variant="danger"
        />
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setValidationErrors({});
          }}
          title="新しいテーブルの追加"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddTable(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="form-label">
                  テーブル番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="number"
                  value={addFormData.number || ""}
                  onChange={handleAddTableInputChange}
                  className={`form-input mt-1 ${validationErrors.number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="1"
                  min="1"
                  required
                />
                {validationErrors.number && (
                  <p className="form-error">{validationErrors.number}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label className="form-label">
                  収容人数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={addFormData.capacity || ""}
                  onChange={handleAddTableInputChange}
                  className={`form-input mt-1 ${validationErrors.capacity ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="4"
                  min="1"
                  required
                />
                {validationErrors.capacity && (
                  <p className="form-error">{validationErrors.capacity}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="form-label">
                エリア <span className="text-red-500">*</span>
              </label>
              <select
                name="area"
                value={addFormData.area || ""}
                onChange={handleAddTableInputChange}
                className={`form-select mt-1 ${validationErrors.area ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} - {area.description}
                  </option>
                ))}
              </select>
              {validationErrors.area && (
                <p className="form-error">{validationErrors.area}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                状態 <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={addFormData.status || ""}
                onChange={handleAddTableInputChange}
                className={`form-select mt-1 ${validationErrors.status ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name} - {status.description}
                  </option>
                ))}
              </select>
              {validationErrors.status && (
                <p className="form-error">{validationErrors.status}</p>
              )}
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

export default TablesPage;