import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { 
  getCategories, 
  getMenuItems, 
  updateMenuItem, 
  deleteMenuItem, 
  createMenuItem, 
  createCategory,
  MenuItem,
  Category,
  CreateMenuItemData,
  CreateCategoryData
} from "../../services/menuService";

const MenuPage = () => {
  const navigate = useNavigate();

  // カテゴリデータ（APIから取得）
  const [categories, setCategories] = useState<Category[]>([]);
  
  // メニューデータ（APIから取得）
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editFormData, setEditFormData] = useState<MenuItem>({
    id: 0,
    name: "",
    description: "",
    price: 0,
    categoryId: 0,
    available: true,
  });
  
  const [addFormData, setAddFormData] = useState<CreateMenuItemData>({
    name: "",
    description: "",
    price: 0,
    categoryId: 0,
    available: true,
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  
  const [addCategoryData, setAddCategoryData] = useState<CreateCategoryData>({
    name: "",
  });

  // 選択中のカテゴリ
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // 選択中の状態（提供中・停止中）
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(null);

  // APIからカテゴリデータを取得
  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError('カテゴリデータの取得に失敗しました');
      }
    } catch (err) {
      setError('カテゴリデータの取得中にエラーが発生しました');
      console.error('Error fetching categories:', err);
    }
  };

  // APIからメニューデータを取得
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMenuItems();
      if (response.success && response.data) {
        setMenuItems(response.data);
      } else {
        setError('メニューデータの取得に失敗しました');
      }
    } catch (err) {
      setError('メニューデータの取得中にエラーが発生しました');
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時にデータを取得
  useEffect(() => {
    const initializeData = async () => {
      await fetchCategories();
      await fetchMenuItems();
    };
    
    initializeData();
  }, []);
  
  // カテゴリが更新されたときにフォームの初期値を更新
  useEffect(() => {
    if (categories.length > 0 && addFormData.categoryId === 0) {
      setAddFormData(prev => ({
        ...prev,
        categoryId: categories[0].id
      }));
    }
  }, [categories, addFormData.categoryId]);

  // フィルタリングされたメニューアイテム
  const filteredItems = menuItems.filter((item) => {
    // カテゴリフィルター
    const categoryMatch = selectedCategory === null || item.categoryId === selectedCategory;
    // 状態フィルター
    const statusMatch = selectedStatus === null || item.available === selectedStatus;
    
    return categoryMatch && statusMatch;
  });

  // カテゴリ名を取得する関数
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "不明なカテゴリ";
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setEditFormData({ ...item });
    setEditImagePreview(item.image || null);
    setEditImageFile(null);
    setError(null); // エラーメッセージをクリア
    setSuccessMessage(null); // 成功メッセージをクリア
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteDialog = (item: MenuItem) => {
    setSelectedItem(item);
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
    } else if (name === 'price') {
      setEditFormData({
        ...editFormData,
        [name]: parseInt(value, 10) || 0,
      });
    } else if (name === 'categoryId') {
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

  const handleEditItem = async () => {
    // バリデーション
    if (!editFormData.name.trim()) {
      setError('メニュー名を入力してください');
      return;
    }
    
    if (editFormData.price <= 0) {
      setError('価格は0より大きい値を入力してください');
      return;
    }
    
    if (editFormData.price > 999999) {
      setError('価格は999,999円以下で入力してください');
      return;
    }
    
    if (editFormData.description.length > 200) {
      setError('説明文は200文字以下で入力してください');
      return;
    }
    
    if (!editFormData.categoryId || editFormData.categoryId === 0) {
      setError('カテゴリを選択してください');
      return;
    }
    
    try {
      setError(null);
      
      // 画像が新たにアップロードされた場合は、画像URLを生成（実際の実装では画像アップロードAPIを呼び出す）
      let imageUrl = editFormData.image;
      if (editImageFile) {
        // TODO: 実際の画像アップロードAPIを実装
        // const uploadResult = await uploadImage(editImageFile);
        // imageUrl = uploadResult.url;
        imageUrl = editImagePreview || undefined; // 仮のURL（実際の実装では上記のuploadResultを使用）
      }
      
      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        price: editFormData.price,
        categoryId: editFormData.categoryId,
        available: editFormData.available,
        image: imageUrl || undefined
      };
      
      const result = await updateMenuItem(editFormData.id.toString(), updateData);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setSuccessMessage('メニューが正常に更新されました');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        setIsEditModalOpen(false);
        setSelectedItem(null);
        removeEditImage();
      } else {
        setError(result.error || 'メニュー項目の更新に失敗しました');
      }
    } catch (error) {
      console.error("メニュー項目の更新に失敗しました", error);
      setError('メニュー項目の更新中にエラーが発生しました');
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      const result = await deleteMenuItem(selectedItem.id.toString());
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      } else {
        setError(result.error || 'メニュー項目の削除に失敗しました');
      }
    } catch (error) {
      console.error("メニュー項目の削除に失敗しました", error);
      setError('メニュー項目の削除中にエラーが発生しました');
    }
  };
  
  const handleAddCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddCategoryData({
      ...addCategoryData,
      [name]: value,
    });
  };
  
  const handleAddCategory = async () => {
    // バリデーション
    if (!addCategoryData.name.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }
    
    try {
      setError(null);
      const createData = {
        name: addCategoryData.name.trim(),
        description: addCategoryData.description?.trim()
      };
      
      const result = await createCategory(createData);
      
      if (result.success) {
        // カテゴリデータを再取得
        await fetchCategories();
        
        setSuccessMessage('カテゴリが正常に追加されました');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        setAddCategoryData({ name: "" });
        setIsAddCategoryModalOpen(false);
      } else {
        setError(result.error || 'カテゴリの追加に失敗しました');
      }
    } catch (error) {
      console.error("カテゴリの追加に失敗しました", error);
      setError('カテゴリの追加中にエラーが発生しました');
    }
  };
  
  const handleAddItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setAddFormData({
        ...addFormData,
        [name]: checked,
      });
    } else if (name === 'price') {
      setAddFormData({
        ...addFormData,
        [name]: parseInt(value, 10) || 0,
      });
    } else if (name === 'categoryId') {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック (5MB以下)
      if (file.size > 5 * 1024 * 1024) {
        setError('画像ファイルは5MB以下にしてください');
        return;
      }
      
      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください');
        return;
      }
      
      setImageFile(file);
      
      // プレビュー表示用のURL生成
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック (5MB以下)
      if (file.size > 5 * 1024 * 1024) {
        setError('画像ファイルは5MB以下にしてください');
        return;
      }
      
      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください');
        return;
      }
      
      setEditImageFile(file);
      
      // プレビュー表示用のURL生成
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleAddItem = async () => {
    console.log('handleAddItem called with data:', addFormData);
    
    // バリデーション
    if (!addFormData.name.trim()) {
      setError('メニュー名を入力してください');
      return;
    }
    
    if (addFormData.price <= 0) {
      setError('価格は0より大きい値を入力してください');
      return;
    }
    
    if (addFormData.price > 999999) {
      setError('価格は999,999円以下で入力してください');
      return;
    }
    
    if (addFormData.description.length > 200) {
      setError('説明文は200文字以下で入力してください');
      return;
    }
    
    if (!addFormData.categoryId || addFormData.categoryId === 0) {
      setError('カテゴリを選択してください');
      return;
    }
    
    try {
      setError(null);
      
      // 画像がアップロードされた場合は、画像URLを生成（実際の実装では画像アップロードAPIを呼び出す）
      let imageUrl;
      if (imageFile) {
        // TODO: 実際の画像アップロードAPIを実装
        // const uploadResult = await uploadImage(imageFile);
        // imageUrl = uploadResult.url;
        imageUrl = imagePreview || undefined; // 仮のURL（実際の実装では上記のuploadResultを使用）
      }
      
      const createData = {
        name: addFormData.name.trim(),
        description: addFormData.description.trim(),
        price: addFormData.price,
        categoryId: addFormData.categoryId,
        available: addFormData.available,
        image: imageUrl || undefined
      };
      
      console.log('Sending data to API:', createData);
      const result = await createMenuItem(createData);
      console.log('API result:', result);
      
      if (result.success) {
        // データを再取得してリストを更新
        await fetchMenuItems();
        
        setSuccessMessage('メニューが正常に追加されました');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        setAddFormData({
          name: "",
          description: "",
          price: 0,
          categoryId: categories.length > 0 ? categories[0].id : 1,
          available: true,
        });
        removeImage();
        setIsAddModalOpen(false);
      } else {
        setError(result.error || 'メニュー項目の追加に失敗しました');
      }
    } catch (error) {
      console.error("メニュー項目の追加に失敗しました", error);
      setError('メニュー項目の追加中にエラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダーセクション */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">メニュー管理</h1>
                <p className="text-sm text-gray-500">レストランのメニューとカテゴリを管理</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                合計 <span className="font-semibold text-gray-900">{menuItems.length}</span> 件のメニュー
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                新規メニュー
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 成功メッセージ表示 */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-4 text-green-400 hover:text-green-600 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* カテゴリフィルター */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">カテゴリフィルター</h2>
                  <p className="text-sm text-gray-500">表示するメニューのカテゴリを選択</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setIsAddCategoryModalOpen(true);
                }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                カテゴリ追加
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === null
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                すべてのメニュー
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-white bg-opacity-30 text-blue-600">
                  {menuItems.length}
                </span>
              </button>

              {categories.map((category) => {
                const itemCount = menuItems.filter(item => item.categoryId === category.id).length;
                return (
                  <button
                    key={category.id}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white shadow-md transform scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      selectedCategory === category.id
                        ? "bg-white bg-opacity-30 text-blue-600"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {itemCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 状態フィルター */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">提供状態フィルター</h2>
                  <p className="text-sm text-gray-500">メニューの提供状態で絞り込み</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedStatus === null
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                }`}
                onClick={() => setSelectedStatus(null)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                すべての状態
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-white bg-opacity-30 text-blue-600">
                  {menuItems.length}
                </span>
              </button>

              <button
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedStatus === true
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                }`}
                onClick={() => setSelectedStatus(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                提供中
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                  selectedStatus === true
                    ? "bg-white bg-opacity-30 text-blue-600"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {menuItems.filter(item => item.available).length}
                </span>
              </button>

              <button
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedStatus === false
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                }`}
                onClick={() => setSelectedStatus(false)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                停止中
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                  selectedStatus === false
                    ? "bg-white bg-opacity-30 text-blue-600"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {menuItems.filter(item => !item.available).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* メニュー一覧 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {(() => {
                      const categoryText = selectedCategory ? getCategoryName(selectedCategory) : 'すべてのメニュー';
                      const statusText = selectedStatus === true ? '（提供中のみ）' : 
                                        selectedStatus === false ? '（停止中のみ）' : '';
                      return `${categoryText}${statusText}`;
                    })()}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filteredItems.length}件のメニューを表示中
                    {(selectedCategory !== null || selectedStatus !== null) && 
                      ` (全${menuItems.length}件中)`
                    }
                  </p>
                </div>
              </div>
              
              {filteredItems.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    提供中: {filteredItems.filter(item => item.available).length}件
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    停止中: {filteredItems.filter(item => !item.available).length}件
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium">メニューデータを読み込み中...</p>
                <p className="text-sm text-gray-400 mt-1">しばらくお待ちください</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedCategory ? 'このカテゴリにメニューがありません' : 'メニューが登録されていません'}
                </h3>
                <p className="text-gray-500 mb-6 text-center max-w-sm">
                  {selectedCategory 
                    ? '別のカテゴリを選択するか、新しいメニューを追加してください'
                    : '新しいメニュー項目を追加して始めましょう'
                  }
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  最初のメニューを追加
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-80 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メニュー名
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        価格
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        カテゴリ
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状態
                      </th>
                      <th className="w-32 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name.length > 40 ? `${item.name.slice(0, 40)}...` : item.name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description.length > 60 ? `${item.description.slice(0, 60)}...` : item.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ¥{item.price.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getCategoryName(item.categoryId)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.available ? "提供中" : "停止中"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="編集"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteDialog(item)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="削除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            removeEditImage();
            setError(null);
            setSuccessMessage(null);
          }}
          title="メニュー項目の編集"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleEditItem(); }} className="space-y-8">
            {/* 画像アップロード セクション */}
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  メニュー画像
                </label>
                
                {editImagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={editImagePreview}
                      alt="プレビュー"
                      className="w-48 h-32 object-cover rounded-lg shadow-md mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeEditImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center mx-auto bg-white">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">画像をアップロード</span>
                  </div>
                )}
                
                <input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="hidden"
                />
                
                <div className="mt-4 flex justify-center space-x-3">
                  <label
                    htmlFor="edit-image-upload"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {editImagePreview ? '画像を変更' : 'ファイル選択'}
                  </label>
                  {editImagePreview && (
                    <button
                      type="button"
                      onClick={removeEditImage}
                      className="bg-red-100 text-red-700 border border-red-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG, GIF形式 (最大5MB)
                </p>
              </div>
            </div>

            {/* 基本情報 セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                基本情報
              </h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メニュー名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="例: 特製ハンバーグ"
                    required
                  />
                </div>
                
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    価格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      name="price"
                      value={editFormData.price || ""}
                      onChange={handleInputChange}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="1000"
                      min="0"
                      max="999999"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">0〜999,999円</p>
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メニュー説明
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description || ""}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="このメニューの特徴や材料、調理方法などを詳しく説明してください..."
                  />
                  <div className="mt-1 flex justify-between items-center">
                    <p className="text-xs text-gray-500">お客様に魅力を伝える説明文を入力してください</p>
                    <span className="text-xs text-gray-400">{editFormData.description.length}/200文字</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 設定 セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={editFormData.categoryId || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">カテゴリを選択してください</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="available"
                    checked={editFormData.available}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditFormData({
                        ...editFormData,
                        available: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-900">
                      提供中
                    </label>
                    <p className="text-xs text-gray-500">
                      チェックを外すと、このメニューは注文できなくなります
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                onClick={() => {
                  setIsEditModalOpen(false);
                  removeEditImage();
                  setError(null);
                  setSuccessMessage(null);
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                変更を保存
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteItem}
          title="メニュー項目の削除"
          message={`「${selectedItem?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
          confirmText="削除"
          variant="danger"
        />
      )}

      {/* メニュー追加モーダル */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            removeImage();
            setError(null);
            setSuccessMessage(null);
          }}
          title="新しいメニュー項目を追加"
          size="lg"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddItem(); }} className="space-y-8">
            {/* 画像アップロード セクション */}
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  メニュー画像
                </label>
                
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="プレビュー"
                      className="w-48 h-32 object-cover rounded-lg shadow-md mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center mx-auto bg-white">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">画像をアップロード</span>
                  </div>
                )}
                
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <div className="mt-4 flex justify-center space-x-3">
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ファイル選択
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="bg-red-100 text-red-700 border border-red-200 rounded-md px-4 py-2 text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
                
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG, GIF形式 (最大5MB)
                </p>
              </div>
            </div>

            {/* 基本情報 セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                基本情報
              </h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メニュー名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={addFormData.name || ""}
                    onChange={handleAddItemInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="例: 特製ハンバーグ"
                    required
                  />
                </div>
                
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    価格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      name="price"
                      value={addFormData.price || ""}
                      onChange={handleAddItemInputChange}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="1000"
                      min="0"
                      max="999999"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">0〜999,999円</p>
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メニュー説明
                  </label>
                  <textarea
                    name="description"
                    value={addFormData.description || ""}
                    onChange={handleAddItemInputChange}
                    rows={4}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="このメニューの特徴や材料、調理方法などを詳しく説明してください..."
                  />
                  <div className="mt-1 flex justify-between items-center">
                    <p className="text-xs text-gray-500">お客様に魅力を伝える説明文を入力してください</p>
                    <span className="text-xs text-gray-400">{addFormData.description.length}/200文字</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 設定 セクション */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={addFormData.categoryId || ""}
                    onChange={handleAddItemInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">カテゴリを選択してください</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="available"
                    checked={addFormData.available}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setAddFormData({
                        ...addFormData,
                        available: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-900">
                      提供開始
                    </label>
                    <p className="text-xs text-gray-500">
                      チェックを外すと、このメニューは注文できなくなります
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                onClick={() => {
                  setIsAddModalOpen(false);
                  removeImage();
                  setError(null);
                  setSuccessMessage(null);
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                メニューを追加
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* カテゴリ追加モーダル */}
      {isAddCategoryModalOpen && (
        <Modal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          title="カテゴリの追加"
          size="md"
        >
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleAddCategory(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリ名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={addCategoryData.name || ""}
                onChange={handleAddCategoryInputChange}
                className="form-input mt-1"
                placeholder="カテゴリ名を入力"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsAddCategoryModalOpen(false)}
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

export default MenuPage;