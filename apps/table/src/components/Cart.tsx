import React from "react";
import { CartItem } from "../types";

interface CartProps {
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onOrder: () => void;
  tableNumber: string;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOrder,
  tableNumber,
}) => {
  // 合計金額を計算
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      // 商品の基本価格
      let itemPrice = item.menuItem.price;

      // オプションの価格を追加
      item.options.forEach((option) => {
        itemPrice += option.price;
      });

      // トッピングの価格を追加
      item.toppings.forEach((topping) => {
        itemPrice += topping.price;
      });

      // 数量をかける
      return total + itemPrice * item.quantity;
    }, 0);
  };

  // 商品がないときの表示
  if (cartItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 pt-4 sm:pt-8 px-4 overflow-y-auto">
        <div className="bg-white rounded-lg w-full max-w-md shadow-xl transform transition-all">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">カート</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-gray-500">カートは空です</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-[#e0815e] text-white rounded-md hover:bg-[#d3704f] transition-colors"
            >
              メニューを見る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 pt-4 sm:pt-8 px-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl transform transition-all mb-8">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">カート</h2>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-4">
              テーブル: {tableNumber}
            </span>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* カートアイテム一覧 */}
        <div className="divide-y divide-gray-200">
          {cartItems.map((item, index) => (
            <div key={index} className="p-4">
              <div className="flex mb-2">
                <div className="text-2xl mr-3">{item.menuItem.image}</div>
                <div className="flex-grow">
                  <h3 className="font-medium">{item.menuItem.name}</h3>

                  {/* 選択されたオプションを表示 */}
                  {item.options.length > 0 && (
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="font-medium">オプション:</span>{" "}
                      {item.options.map((opt) => opt.name).join(", ")}
                    </div>
                  )}

                  {/* 選択されたトッピングを表示 */}
                  {item.toppings.length > 0 && (
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="font-medium">トッピング:</span>{" "}
                      {item.toppings.map((top) => top.name).join(", ")}
                    </div>
                  )}

                  {/* 備考を表示 */}
                  {item.notes && (
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="font-medium">備考:</span> {item.notes}
                    </div>
                  )}
                </div>

                {/* アイテムの価格 */}
                <div className="text-[#e0815e] font-semibold">
                  ¥{item.menuItem.price}
                </div>
              </div>

              {/* 数量変更と削除ボタン */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center">
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-200 rounded-l-md flex items-center justify-center"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <div className="w-10 h-8 bg-white border-t border-b border-gray-300 flex items-center justify-center">
                    {item.quantity}
                  </div>
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-200 rounded-r-md flex items-center justify-center"
                    disabled={item.quantity >= 10}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(index)}
                  className="text-gray-400 hover:text-gray-700"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 合計金額とオーダーボタン */}
        <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700 font-medium">合計</span>
            <span className="text-xl font-bold text-[#e0815e]">
              ¥{calculateTotal()}
            </span>
          </div>

          <button
            onClick={onOrder}
            className="w-full bg-[#e0815e] text-white py-3 rounded-md hover:bg-[#d3704f] transition-colors"
          >
            注文を確定する
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
