import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTableOrders } from "../services/orderService";
import { UI_CONFIG } from "../config";
import LoadingSpinner from "../components/LoadingSpinner";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
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
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  createdAt: string;
  items: OrderItem[];
}

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableNumber = UI_CONFIG.TABLE_NUMBER;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const tableId = parseInt(tableNumber) || 1;
        const response = await getTableOrders(tableId);
        
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
  }, [tableNumber]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "受付済み";
      case "preparing":
        return "調理中";
      case "ready":
        return "お渡し準備完了";
      case "delivered":
        return "お渡し済み";
      case "cancelled":
        return "キャンセル";
      default:
        return status;
    }
  };

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;
      
      if (item.options) {
        item.options.forEach(option => {
          itemTotal += option.price * item.quantity;
        });
      }
      
      if (item.toppings) {
        item.toppings.forEach(topping => {
          itemTotal += topping.price * item.quantity;
        });
      }
      
      return total + itemTotal;
    }, 0);
  };

  const handleBackToMenu = () => {
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">注文情報を取得中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md mt-6">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToMenu}
            className="px-6 py-3 bg-[#e0815e] text-white rounded-xl hover:bg-[#d3704f] transition-colors shadow-md"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md mt-6">
        <div className="text-center">
          <div className="text-gray-400 text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">注文履歴がありません</h2>
          <p className="text-gray-600 mb-6">まだ注文されていないようです。</p>
          <button
            onClick={handleBackToMenu}
            className="px-6 py-3 bg-[#e0815e] text-white rounded-xl hover:bg-[#d3704f] transition-colors shadow-md"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">注文状況</h1>
        <button
          onClick={handleBackToMenu}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          メニューに戻る
        </button>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">注文番号: {order.id}</span>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-800">
                          {item.name}
                        </span>
                        <span className="text-gray-600">
                          {item.quantity}個
                        </span>
                      </div>

                      {/* オプション表示 */}
                      {item.options && item.options.length > 0 && (
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="font-medium">オプション:</span>{" "}
                          {item.options.map((opt) => opt.name).join(", ")}
                        </div>
                      )}

                      {/* トッピング表示 */}
                      {item.toppings && item.toppings.length > 0 && (
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="font-medium">トッピング:</span>{" "}
                          {item.toppings.map((top) => top.name).join(", ")}
                        </div>
                      )}

                      {/* 備考表示 */}
                      {item.notes && (
                        <div className="mt-1 text-sm text-gray-500">
                          <span className="font-medium">備考:</span> {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">合計</span>
                <span className="text-xl font-bold text-[#e0815e]">
                  ¥{calculateOrderTotal(order)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
