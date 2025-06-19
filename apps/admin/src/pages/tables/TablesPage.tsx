import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { getTables, createTable, updateTable, deleteTable } from "../../services/tableService";

// テーブルの型定義
type Table = {
  id: number;
  number: number;
  capacity: number;
  qrCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
};


const TablesPage = () => {
  const navigate = useNavigate();


  // テーブルデータ（APIから取得）
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


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
  
  const [addFormData, setAddFormData] = useState<{number: number, capacity: number}>({
    number: 0,
    capacity: 0,
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
  const filteredTables = tables;

  // バリデーション関数
  const validateForm = (data: {number: number, capacity: number} | Table): boolean => {
    const errors: Record<string, string> = {};

    if (!data.number || data.number <= 0) {
      errors.number = "テーブル番号は1以上の数値を入力してください";
    }

    if (!data.capacity || data.capacity <= 0) {
      errors.capacity = "収容人数は1以上の数値を入力してください";
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
      };

      const result = await createTable(createData);
      
      if (result.success) {
        await fetchTables();
        setAddFormData({
          number: 0,
          capacity: 0,
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


      {/* Table List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">テーブル一覧</h3>
              <p className="mt-1 text-sm text-gray-500">
                全テーブル - {tables.length}テーブル
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
                新しいテーブルを追加して始めましょう。
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">テーブル番号</th>
                    <th className="table-header-cell">収容人数</th>
                    <th className="table-header-cell">登録日</th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredTables.map((table) => {
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
            setError(null);
          }}
          title="テーブル情報の編集"
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
            setError(null);
          }}
          title="新しいテーブルの追加"
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

export default TablesPage;