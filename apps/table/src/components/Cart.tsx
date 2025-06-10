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
                  className="p-5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 border-l-4 border-transparent hover:border-orange-400"
                >
                  <div className="flex mb-4">
                    <div className="mr-4 h-16 w-16 rounded-2xl shadow-md overflow-hidden">
                      <img
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-800 text-lg">
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
                      <div className="text-orange-600 font-bold text-xl mt-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        ¥{calculateItemPrice(item).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 数量変更と削除ボタン */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-1 shadow-md">
                      <button
                        onClick={() =>
                          onUpdateQuantity(index, item.quantity - 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all duration-200 group"
                        disabled={item.quantity <= 1}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <div className="w-12 h-10 flex items-center justify-center font-bold text-lg text-gray-800 bg-white rounded-xl mx-1">
                        {item.quantity}
                      </div>
                      <button
                        onClick={() =>
                          onUpdateQuantity(index, item.quantity + 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all duration-200 group"
                        disabled={item.quantity >= 10}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-gray-400 hover:text-red-500 transition-all duration-200 p-3 rounded-xl hover:bg-red-50 group"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 group-hover:scale-110 transition-transform"
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
          <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-orange-50 to-red-50 sticky bottom-0">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-700 font-bold text-lg">合計金額</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                ¥{calculateTotal().toLocaleString()}
              </span>
            </div>

            <button
              onClick={onOrder}
              disabled={isSubmitting}
              className={`group w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:from-orange-600 hover:to-red-600"
              }`}
            >
              <div className="flex items-center justify-center">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    注文処理中...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    注文を確定する
                    <svg className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </div>
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
