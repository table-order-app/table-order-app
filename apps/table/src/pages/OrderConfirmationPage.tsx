import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTableOrders, requestCheckout } from "../services/orderService";
import { getPath } from "../routes";
import { getImageUrlWithFallback } from "../utils/imageUtils";
import LoadingSpinner from "../components/LoadingSpinner";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  menuItem: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
  options?: Array<{
    name: string;
    price: number;
  }>;
  toppings?: Array<{
    name: string;
    price: number;
  }>;
  notes?: string;
}

interface Order {
  id: number;
  tableId: number;
  status: "new" | "in-progress" | "ready" | "delivered" | "cancelled";
  createdAt: string;
  items: OrderItem[];
}

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutRequesting, setCheckoutRequesting] = useState(false);
  
  // ローカルストレージから実際のテーブル番号を取得
  const getTableNumber = () => {
    return parseInt(localStorage.getItem('accorto_table_number') || '1') || 1;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const tableNumber = getTableNumber();

        
        // テーブル番号を直接使用（新しいAPI設計）
        const response = await getTableOrders(tableNumber);
        
        if (response.success && response.data) {
          const sortedOrders = [...response.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sortedOrders);
          setError(null);
        } else {
          setError(response.error || "注文データの取得に失敗しました");
        }
      } catch (err) {
        setError("注文データの取得中にエラーが発生しました");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
    const intervalId = setInterval(fetchOrders, 30000);
    return () => clearInterval(intervalId);
  }, []);


  const calculateTotalAmount = (orders: Order[]) => {
    return orders.reduce((total, order) => {
      return total + order.items.reduce((orderTotal, item) => {
        // 基本価格を数値として確実に取得
        let itemTotal = Number(item.menuItem?.price) || 0;
        
        // オプション価格を追加
        if (item.options) {
          item.options.forEach(option => {
            itemTotal += Number(option.price) || 0;
          });
        }
        
        // トッピング価格を追加
        if (item.toppings) {
          item.toppings.forEach(topping => {
            itemTotal += Number(topping.price) || 0;
          });
        }
        
        // 数量をかけて合計に追加
        const quantity = Number(item.quantity) || 0;
        return orderTotal + (itemTotal * quantity);
      }, 0);
    }, 0);
  };

  const handleBackToMenu = () => {
    navigate("/");
  };

  const handleContinueShopping = () => {
    navigate("/categories");
  };

  const handleRequestCheckout = async () => {
    if (checkoutRequesting) return;
    
    try {
      setCheckoutRequesting(true);
      const tableNumber = getTableNumber();
      const response = await requestCheckout(tableNumber);
      
      if (response.success) {
        // 成功時は専用ページに遷移
        navigate(getPath.checkoutRequest());
      } else {
        // エラー時はアラートで表示
        alert(response.error || "会計要請に失敗しました。もう一度お試しください。");
      }
    } catch (error) {
      console.error("Error requesting checkout:", error);
      alert("会計要請中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setCheckoutRequesting(false);
    }
  };

  // 全ての注文が提供済みかチェック
  const allOrdersDelivered = orders.length > 0 && orders.every(order => order.status === "delivered");


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">注文情報を取得中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-red-200 rounded-lg p-8 text-center shadow-sm">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleContinueShopping}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              メニューを見る
            </button>
            <button
              onClick={handleBackToMenu}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">注文履歴がありません</h2>
          <p className="text-gray-600 mb-6">まだ注文されていないようです。</p>
          <div className="space-y-3">
            <button
              onClick={handleContinueShopping}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              注文を始める
            </button>
            <button
              onClick={handleBackToMenu}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
          {/* 会計要請ボタン（目立つ位置） */}
          {allOrdersDelivered && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">お食事が完了しました</h3>
                    <p className="text-sm text-blue-700">スタッフに会計をお呼びいただけます</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestCheckout}
                  disabled={checkoutRequesting}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {checkoutRequesting ? "要請中..." : "会計をお願いします"}
                </button>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="mb-6">
            <div className="flex gap-3">
              <button
                onClick={handleContinueShopping}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
              >
                追加注文する
              </button>
              
              <button
                onClick={handleBackToMenu}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                ホーム
              </button>
            </div>
          </div>

          {/* 注文アイテム一覧（まとめて表示） */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {orders.flatMap(order => order.items).map((item, index) => {
                const basePrice = Number(item.menuItem?.price) || 0;
                const optionsPrice = item.options?.reduce((sum, opt) => sum + (Number(opt.price) || 0), 0) || 0;
                const toppingsPrice = item.toppings?.reduce((sum, top) => sum + (Number(top.price) || 0), 0) || 0;
                const itemTotalPrice = (basePrice + optionsPrice + toppingsPrice) * (Number(item.quantity) || 0);

                return (
                  <div key={index} className="p-4 hover:bg-gray-25 transition-colors duration-200">
                    <div className="flex items-start space-x-4">
                      {/* 商品画像 */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg shadow-sm overflow-hidden">
                          <img
                            src={getImageUrlWithFallback(item.menuItem?.image)}
                            alt={item.menuItem?.name || item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* 商品情報 */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {item.menuItem?.name || item.name}
                            </h4>
                            <div className="text-sm text-gray-500 mt-1">
                              ¥{basePrice.toLocaleString()}
                              {optionsPrice > 0 && (
                                <span className="text-gray-600"> + オプション ¥{optionsPrice.toLocaleString()}</span>
                              )}
                              {toppingsPrice > 0 && (
                                <span className="text-gray-600"> + トッピング ¥{toppingsPrice.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">
                              ×{item.quantity}
                            </div>
                            <div className="font-medium text-gray-800">
                              ¥{itemTotalPrice.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* オプション・トッピング表示 */}
                        <div className="space-y-2">
                          {item.options && item.options.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                オプション
                              </span>
                              <span className="text-sm text-gray-600">
                                {item.options.map((opt, i) => (
                                  <span key={i}>
                                    {opt.name} (+¥{Number(opt.price).toLocaleString()})
                                    {i < item.options!.length - 1 && ", "}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}

                          {item.toppings && item.toppings.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                トッピング
                              </span>
                              <span className="text-sm text-gray-600">
                                {item.toppings.map((top, i) => (
                                  <span key={i}>
                                    {top.name} (+¥{Number(top.price).toLocaleString()})
                                    {i < item.toppings!.length - 1 && ", "}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}

                          {item.notes && (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                備考
                              </span>
                              <span className="text-sm text-gray-600">{item.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 全体の合計金額 */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">合計金額</span>
                <span className="text-lg font-bold text-gray-800">
                  ¥{calculateTotalAmount(orders).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
    </div>
  );
};

export default OrderConfirmationPage;
