import React, { useState, useEffect } from "react";
import { mockMenuItems } from "./MenuList";

interface MenuDetailProps {
  menuId: number;
  onBack: () => void;
  onAddToCart: (
    menuItem: any,
    options: any[],
    toppings: any[],
    notes: string
  ) => void;
}

const MenuDetail: React.FC<MenuDetailProps> = ({
  menuId,
  onBack,
  onAddToCart,
}) => {
  const [menuItem, setMenuItem] = useState<any | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<number[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    // メニューIDからメニュー情報を取得
    const item = mockMenuItems.find((item) => item.id === menuId);
    if (item) {
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
  }, [menuId]);

  // オプションの選択が変更されたとき
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const optionId = parseInt(e.target.value);

    if (menuItem?.options) {
      // ラジオボタン式の選択（オプションは1つだけ選べる）
      setSelectedOptions([optionId]);

      // 価格を再計算
      calculateTotalPrice([optionId], selectedToppings);
    }
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
      const option = menuItem.options.find((opt: any) => opt.id === optionId);
      if (option) {
        price += option.price;
      }
    });

    // トッピングの金額を追加
    toppings.forEach((toppingId) => {
      const topping = menuItem.toppings.find(
        (top: any) => top.id === toppingId
      );
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
        calculateTotalPrice(selectedOptions, selectedToppings);
      }
    }
  };

  // カートに追加
  const handleAddToCart = () => {
    if (!menuItem) return;

    const selectedOptionDetails = selectedOptions
      .map((optionId) =>
        menuItem.options.find((opt: any) => opt.id === optionId)
      )
      .filter(Boolean);

    const selectedToppingDetails = selectedToppings
      .map((toppingId) =>
        menuItem.toppings.find((top: any) => top.id === toppingId)
      )
      .filter(Boolean);

    onAddToCart(menuItem, selectedOptionDetails, selectedToppingDetails, notes);
  };

  if (!menuItem) {
    return <div className="p-4 text-center">メニューが見つかりません</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg overflow-hidden">
      <div className="sticky top-0 bg-[#e0815e] text-white p-3 z-10 flex items-center">
        <button onClick={onBack} className="text-white mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-lg font-medium flex-grow">{menuItem.name}</h2>
      </div>

      <div className="p-4">
        {/* メニュー画像 */}
        <div className="flex justify-center mb-4">
          <div className="text-8xl">{menuItem.image}</div>
        </div>

        {/* メニュー詳細情報 */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-1 text-gray-800">
            {menuItem.name}
          </h3>
          <p className="text-[#e0815e] font-semibold text-lg mb-2">
            ¥{menuItem.price}
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
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">オプション</h4>
            <div className="space-y-2 pl-2">
              {menuItem.options.map((option: any) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${option.id}`}
                    name="menuOption"
                    value={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onChange={handleOptionChange}
                    className="mr-2"
                  />
                  <label htmlFor={`option-${option.id}`} className="flex-grow">
                    {option.name}
                  </label>
                  <span className="text-gray-600 text-sm">
                    {option.price > 0 ? `+¥${option.price}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* トッピング選択 */}
        {menuItem.toppings && menuItem.toppings.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">トッピング</h4>
            <div className="space-y-2 pl-2">
              {menuItem.toppings.map((topping: any) => (
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

        {/* ご要望欄 */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">ご要望・備考</h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例: 薄味にしてください、ソースは別添えで など"
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={3}
          />
        </div>

        {/* 数量選択 */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">数量</h4>
          <div className="flex items-center">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              className="w-10 h-10 bg-gray-200 rounded-l-md flex items-center justify-center"
              disabled={quantity <= 1}
            >
              -
            </button>
            <div className="w-12 h-10 bg-white border-t border-b border-gray-300 flex items-center justify-center">
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

        {/* 合計金額とカートに追加ボタン */}
        <div className="mb-4 sticky bottom-0 bg-white pt-2">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">合計</span>
            <span className="text-xl font-bold text-[#e0815e]">
              ¥{totalPrice}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-[#e0815e] text-white py-3 rounded-md hover:bg-[#d3704f] transition-colors"
          >
            カートに追加
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuDetail;
