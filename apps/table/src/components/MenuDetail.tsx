import React, { useState, useEffect } from "react";
import { MenuItem, Option, Topping } from "../types";
import { getMenuItem } from "../services/menuService";
import { hasValidImage, getImageUrl } from "../utils/imageUtils";

interface MenuDetailProps {
  menuId: number;
  onAddToCart: (
    menuItem: MenuItem,
    options: Option[],
    toppings: Topping[],
    notes: string,
    quantity: number
  ) => void;
}

const MenuDetail: React.FC<MenuDetailProps> = ({ menuId, onAddToCart }) => {
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);


  useEffect(() => {
    // メニューIDからメニュー情報を取得
    async function fetchMenuItem() {
      try {
        const response = await getMenuItem(menuId);
        if (response.success && response.data) {
          const item = response.data;
          setMenuItem(item);
          setTotalPrice(item.price);

          // もし必須オプションがあればデフォルト選択する
          if (item.options && item.options.length > 0) {
            const defaultOption = item.options.find((option) => option.price === 0);
            if (defaultOption) {
              setSelectedOptions([defaultOption.id]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching menu item:", err);
      }
    }

    fetchMenuItem();
  }, [menuId]);

  // メニューが変更されたら画像エラー状態をリセット
  useEffect(() => {
    setImageError(false);
  }, [menuItem]);

  // オプションの選択が変更されたとき
  const handleOptionClick = (optionId: number) => {
    if (!menuItem?.options) return;

    let newSelectedOptions: number[];

    // 選択済みのオプションをクリックした場合は選択解除
    if (selectedOptions.includes(optionId)) {
      newSelectedOptions = [];
    } else {
      // 新しいオプションを選択（1つだけ選択可能）
      newSelectedOptions = [optionId];
    }

    setSelectedOptions(newSelectedOptions);
    // 価格を再計算
    calculateTotalPrice(newSelectedOptions, selectedToppings);
  };

  // トッピングの選択が変更されたとき
  const handleToppingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toppingId = parseInt(e.target.value);
    const isChecked = e.target.checked;

    let newSelectedToppings: number[];
    if (isChecked) {
      newSelectedToppings = [...selectedToppings, toppingId];
    } else {
      newSelectedToppings = selectedToppings.filter((id) => id !== toppingId);
    }

    setSelectedToppings(newSelectedToppings);

    // 価格を再計算
    calculateTotalPrice(selectedOptions, newSelectedToppings);
  };

  // 合計金額の計算
  const calculateTotalPrice = (options: number[], toppings: number[]) => {
    if (!menuItem) return;

    let price = menuItem.price;

    // オプションの金額を追加
    options.forEach((optionId) => {
      const option = menuItem.options.find((opt) => opt.id === optionId);
      if (option) {
        price += option.price;
      }
    });

    // トッピングの金額を追加
    toppings.forEach((toppingId) => {
      const topping = menuItem.toppings.find((top) => top.id === toppingId);
      if (topping) {
        price += topping.price;
      }
    });

    // 数量を掛ける
    price *= quantity;

    setTotalPrice(price);
  };

  // 数量を変更したとき
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= 10) {
      setQuantity(newQuantity);

      if (menuItem) {
        // 新しい数量で価格を再計算
        let price = menuItem.price;

        // オプションの金額を追加
        selectedOptions.forEach((optionId) => {
          const option = menuItem.options.find((opt) => opt.id === optionId);
          if (option) {
            price += option.price;
          }
        });

        // トッピングの金額を追加
        selectedToppings.forEach((toppingId) => {
          const topping = menuItem.toppings.find((top) => top.id === toppingId);
          if (topping) {
            price += topping.price;
          }
        });

        // 数量を掛ける
        price *= newQuantity;

        setTotalPrice(price);
      }
    }
  };

  // カートに追加
  const handleAddToCart = () => {
    if (!menuItem) return;

    const selectedOptionDetails = selectedOptions
      .map((optionId) => menuItem.options.find((opt) => opt.id === optionId))
      .filter(Boolean) as Option[];

    const selectedToppingDetails = selectedToppings
      .map((toppingId) => menuItem.toppings.find((top) => top.id === toppingId))
      .filter(Boolean) as Topping[];

    onAddToCart(
      menuItem,
      selectedOptionDetails,
      selectedToppingDetails,
      "", // ご要望欄は常に空文字列
      quantity
    );
  };

  if (!menuItem) {
    return <div className="p-4 text-center">メニューが見つかりません</div>;
  }

  const hasImage = hasValidImage(menuItem.image) && !imageError;

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl overflow-hidden pt-16 shadow-lg">
      <div className={`${hasImage ? 'lg:flex lg:gap-8' : 'max-w-4xl mx-auto'} p-6`}>
        {/* メニュー画像セクション（画像がある場合のみ表示） */}
        {hasImage && (
          <div className="lg:w-1/2 mb-6 lg:mb-0">
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
              <img
                src={getImageUrl(menuItem.image)!}
                alt={menuItem.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          </div>
        )}

        {/* メニュー詳細情報セクション */}
        <div className={`${hasImage ? 'lg:w-1/2' : 'w-full'} flex flex-col`}>
          {/* メニュー基本情報 */}
          <div className="mb-6">
            <h3 className="text-3xl font-bold mb-3 text-gray-800">
              {menuItem.name}
            </h3>
            <p className="text-orange-500 font-bold text-2xl mb-4">
              ¥{menuItem.price.toLocaleString()}
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">{menuItem.description}</p>

            {/* アレルゲン情報 */}
            {menuItem.allergens && menuItem.allergens.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">アレルゲン:</span> {menuItem.allergens.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* オプション選択 */}
          {menuItem.options && menuItem.options.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-xl text-gray-700 mb-4">オプション</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuItem.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    className={`p-4 rounded-xl text-base font-medium transition-all border-2 text-left ${
                      selectedOptions.includes(option.id)
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option.name}</span>
                      {option.price > 0 && (
                        <span className="text-sm font-bold">{`+¥${option.price}`}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* トッピング選択 */}
          {menuItem.toppings && menuItem.toppings.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-xl text-gray-700 mb-4">トッピング</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuItem.toppings.map((topping) => (
                  <label
                    key={topping.id}
                    htmlFor={`topping-${topping.id}`}
                    className="flex items-center p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      id={`topping-${topping.id}`}
                      value={topping.id}
                      checked={selectedToppings.includes(topping.id)}
                      onChange={handleToppingChange}
                      className="w-5 h-5 mr-3 accent-orange-500"
                    />
                    <div className="flex-grow">
                      <span className="text-base font-medium">{topping.name}</span>
                    </div>
                    <span className="text-orange-500 font-bold text-base">{`+¥${topping.price}`}</span>
                  </label>
                ))}
              </div>
            </div>
          )}


          {/* 数量選択 */}
          <div className="mb-6">
            <h4 className="font-bold text-xl text-gray-700 mb-4">数量</h4>
            <div className="flex items-center justify-center">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-14 h-14 bg-gray-100 rounded-l-xl flex items-center justify-center text-xl font-bold hover:bg-gray-200 transition-colors"
                disabled={quantity <= 1}
              >
                -
              </button>
              <div className="w-20 h-14 bg-white border-2 border-gray-300 flex items-center justify-center text-2xl font-bold text-gray-800">
                {quantity}
              </div>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-14 h-14 bg-gray-100 rounded-r-xl flex items-center justify-center text-xl font-bold hover:bg-gray-200 transition-colors"
                disabled={quantity >= 10}
              >
                +
              </button>
            </div>
          </div>

          {/* 合計金額とカートに追加ボタン */}
          <div className="mt-auto">
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-700">合計</span>
                <span className="text-3xl font-bold text-orange-500">
                  ¥{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {menuItem.available ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition-all text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                カートに追加
              </button>
            ) : (
              <div className="w-full">
                <div className="bg-gray-100 text-gray-600 py-4 rounded-xl text-center mb-3">
                  <span className="text-lg font-bold">⚠️ 現在提供を停止しています</span>
                </div>
                <p className="text-base text-gray-500 text-center">
                  申し訳ございませんが、こちらのメニューは現在ご注文いただけません。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDetail;
