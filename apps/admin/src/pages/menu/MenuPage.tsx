import { Button } from "@table-order-system/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { updateMenuItem, deleteMenuItem } from "../../services/menuService";

// メニューアイテムの型定義
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
};

// カテゴリの型定義
type Category = {
  id: string;
  name: string;
};

const MenuPage = () => {
  const navigate = useNavigate();

  // サンプルカテゴリデータ
  const [categories] = useState<Category[]>([
    { id: "cat1", name: "前菜" },
    { id: "cat2", name: "メイン" },
    { id: "cat3", name: "デザート" },
    { id: "cat4", name: "ドリンク" },
  ]);

  // サンプルメニューデータ
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: "item1",
      name: "シーザーサラダ",
      description: "新鮮なロメインレタスとクルトンのクラシックサラダ",
      price: 800,
      category: "cat1",
      available: true,
    },
    {
      id: "item2",
      name: "トマトスープ",
      description: "有機トマトから作った自家製スープ",
      price: 600,
      category: "cat1",
      available: true,
    },
    {
      id: "item3",
      name: "ステーキセット",
      description: "A5ランク和牛のステーキと季節の野菜添え",
      price: 3500,
      category: "cat2",
      available: true,
    },
    {
      id: "item4",
      name: "パンナコッタ",
      description: "なめらかなイタリアンデザート、季節のフルーツ添え",
      price: 700,
      category: "cat3",
      available: true,
    },
  ]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editFormData, setEditFormData] = useState<MenuItem>({
    id: "",
    name: "",
    description: "",
    price: 0,
    category: "",
    available: true,
  });

  // 選択中のカテゴリ
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // フィルタリングされたメニューアイテム
  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems;

  // カテゴリ名を取得する関数
  const getCategoryName = (categoryId: string) => {
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
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
      });
    }
  };

  const handleEditItem = async () => {
    try {
      await updateMenuItem(editFormData.id, editFormData);
      
      const updatedItems = menuItems.map((item) => 
        item.id === editFormData.id ? editFormData : item
      );
      setMenuItems(updatedItems);
      
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("メニュー項目の更新に失敗しました", error);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      await deleteMenuItem(selectedItem.id);
      
      const updatedItems = menuItems.filter((item) => item.id !== selectedItem.id);
      setMenuItems(updatedItems);
      
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("メニュー項目の削除に失敗しました", error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">メニュー管理</h2>
        <Button
          label="ダッシュボードに戻る"
          variant="secondary"
          onClick={handleBack}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">カテゴリ</h3>
          <Button label="カテゴリ追加" variant="secondary" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-full ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            すべて
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === category.id
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">メニュー一覧</h3>
          <Button label="メニュー追加" />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  説明
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリ
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
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ¥{item.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getCategoryName(item.category)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.available ? "提供中" : "停止中"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary-dark mr-3"
                        onClick={() => handleOpenEditModal(item)}
                      >
                        編集
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleOpenDeleteDialog(item)}
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
                    表示するメニューアイテムがありません
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
          title="メニュー項目の編集"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleEditItem(); }}>
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
                  説明
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  価格
                </label>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  カテゴリ
                </label>
                <select
                  name="category"
                  value={editFormData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  checked={editFormData.available}
                  onChange={(e) => 
                    setEditFormData({
                      ...editFormData,
                      available: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  提供中
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
                onClick={handleEditItem}
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
          onConfirm={handleDeleteItem}
          title="メニュー項目の削除"
          message={`「${selectedItem?.name}」を削除してもよろしいですか？この操作は元に戻せません。`}
        />
      )}
    </div>
  );
};

export default MenuPage;
