import React, { useEffect, useState } from "react";
import { CartItem } from "../types";

interface CartProps {
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onOrder: () => void;
  tableNumber: string;
  isSubmitting?: boolean;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOrder,
  tableNumber,
  isSubmitting = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // カートが開かれたときのアニメーション効果
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

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

  const handleClose = () => {
    setIsVisible(false);
    // アニメーション時間後にコンポーネントを閉じる
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 商品がないときの表示
  if (cartItems.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className={`fixed inset-0 transition-opacity duration-300 ${isVisible ? "bg-black/10 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none"}`}
          onClick={handleClose}
        ></div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className={`bg-white/95 rounded-2xl w-full max-w-md shadow-2xl transform transition-all duration-300 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            style={{
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">カート</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
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
              <div className="text-6xl mb-6 text-gray-300">🛒</div>
              <p className="text-gray-500 mb-6">カートは空です</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-[#e0815e] text-white rounded-xl hover:bg-[#d3704f] transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                メニューを見る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className={`fixed inset-0 transition-opacity duration-300 ${isVisible ? "bg-black/10 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none"}`}
        onClick={handleClose}
      ></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className={`bg-white/95 rounded-2xl w-full max-w-md shadow-2xl transform transition-all duration-300 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"} overflow-hidden`}
          style={{
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-800">カート</h2>
            <div className="flex items-center">
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                テーブル {tableNumber}
              </span>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 ml-2 rounded-full hover:bg-gray-100"
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
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex mb-3">
                    <div className="text-3xl mr-4 bg-gray-100 h-16 w-16 flex items-center justify-center rounded-xl">
                      {item.menuItem.image}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-800">
                        {item.menuItem.name}
                      </h3>

                      {/* 選択されたオプションを表示 */}
                      {item.options.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="font-medium">オプション:</span>{" "}
                          {item.options.map((opt) => opt.name).join(", ")}
                        </div>
                      )}

                      {/* 選択されたトッピングを表示 */}
                      {item.toppings.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="font-medium">トッピング:</span>{" "}
                          {item.toppings.map((top) => top.name).join(", ")}
                        </div>
                      )}

                      {/* 備考を表示 */}
                      {item.notes && (
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="font-medium">備考:</span>{" "}
                          {item.notes}
                        </div>
                      )}

                      {/* 金額表示 */}
                      <div className="text-[#e0815e] font-semibold mt-1">
                        ¥{calculateItemPrice(item)}
                      </div>
                    </div>
                  </div>

                  {/* 数量変更と削除ボタン */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() =>
                          onUpdateQuantity(index, item.quantity - 1)
                        }
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <div className="w-10 h-9 flex items-center justify-center font-medium text-gray-800">
                        {item.quantity}
                      </div>
                      <button
                        onClick={() =>
                          onUpdateQuantity(index, item.quantity + 1)
                        }
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        disabled={item.quantity >= 10}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-gray-400 hover:text-[#e0815e] transition-colors p-2 rounded-full hover:bg-gray-100"
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
          </div>

          {/* 合計金額とオーダーボタン */}
          <div className="p-5 border-t border-gray-100 bg-white sticky bottom-0">
            <div className="flex justify-between items-center mb-5">
              <span className="text-gray-700 font-medium">合計</span>
              <span className="text-2xl font-bold text-[#e0815e]">
                ¥{calculateTotal()}
              </span>
            </div>

            <button
              onClick={onOrder}
              disabled={isSubmitting}
              className={`w-full bg-[#e0815e] text-white py-4 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-[#d3704f]"
              }`}
            >
              {isSubmitting ? "注文処理中..." : "注文を確定する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 商品1つあたりの金額を計算する関数
const calculateItemPrice = (item: CartItem) => {
  let price = item.menuItem.price;

  // オプションの価格を追加
  item.options.forEach((opt) => {
    price += opt.price;
  });

  // トッピングの価格を追加
  item.toppings.forEach((top) => {
    price += top.price;
  });

  return price * item.quantity;
};

export default Cart;
