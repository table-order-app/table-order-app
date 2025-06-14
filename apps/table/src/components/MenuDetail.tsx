import React, { useState, useEffect } from "react";
import { MenuItem, Option, Topping } from "../types";
import { getMenuItem } from "../services/menuService";
import { getImageUrlWithFallback } from "../utils/imageUtils";

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

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg overflow-hidden pt-16">
      <div className="p-3">
        {/* メニュー画像 */}
        <div className="flex justify-center mb-3">
          <div className="w-56 h-36 rounded-lg overflow-hidden shadow-md">
            <img
              src={getImageUrlWithFallback(menuItem.image)}
              alt={menuItem.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* メニュー詳細情報 */}
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-1 text-gray-800">
            {menuItem.name}
          </h3>
          <p className="text-orange-500 font-semibold text-lg mb-2">
            ¥{menuItem.price.toLocaleString()}
          </p>
          <p className="text-gray-600">{menuItem.description}</p>

          {/* アレルゲン情報 */}
          {menuItem.allergens && menuItem.allergens.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                アレルゲン: {menuItem.allergens.join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* オプション選択 */}
        {menuItem.options && menuItem.options.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-3">オプション</h4>
            <div className="flex flex-wrap gap-2">
              {menuItem.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    selectedOptions.includes(option.id)
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-orange-50"
                  }`}
                >
                  {option.name}
                  {option.price > 0 && (
                    <span className="ml-1">{`+¥${option.price}`}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* トッピング選択 */}
        {menuItem.toppings && menuItem.toppings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">トッピング</h4>
            <div className="space-y-2 pl-2">
              {menuItem.toppings.map((topping) => (
                <div key={topping.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`topping-${topping.id}`}
                    value={topping.id}
                    checked={selectedToppings.includes(topping.id)}
                    onChange={handleToppingChange}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`topping-${topping.id}`}
                    className="flex-grow"
                  >
                    {topping.name}
                  </label>
                  <span className="text-gray-600 text-sm">{`+¥${topping.price}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* 数量選択 */}
        <div className="mb-4">
          <div className="flex flex-col items-center">
            <h4 className="font-medium text-gray-700 mb-3">数量</h4>
            <div className="flex items-center">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-10 h-10 bg-gray-200 rounded-l-md flex items-center justify-center"
                disabled={quantity <= 1}
              >
                -
              </button>
              <div className="w-12 h-10 bg-white border border-gray-300 flex items-center justify-center text-lg font-medium text-gray-800">
                {quantity}
              </div>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-10 h-10 bg-gray-200 rounded-r-md flex items-center justify-center"
                disabled={quantity >= 10}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 合計金額とカートに追加ボタン */}
        <div className="mb-4 sticky bottom-0 bg-white pt-2">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">合計</span>
            <span className="text-xl font-bold text-orange-500">
              ¥{totalPrice.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-orange-500 text-white py-3 rounded-md hover:bg-orange-600 transition-colors"
          >
            カートに追加
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuDetail;
