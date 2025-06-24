import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Order } from "../../types/order";
import { getTableOrders, updateOrderItemStatus, checkoutTable } from "../../services/orderService";

// API status mapping function
const mapApiStatusToOrderStatus = (apiStatus: string) => {
  switch (apiStatus) {
    case "new":
      return "new" as const;
    case "in-progress":
      return "in-progress" as const;
    case "ready":
      return "ready" as const;
    case "completed":
      return "completed" as const;
    case "delivered":
      return "delivered" as const;
    case "cancelled":
      return "cancelled" as const;
    default:
      return "new" as const;
  }
};

// Transform API order data to UI format
const transformApiOrderToOrder = (apiOrder: any): Order => {
  const transformedItems = apiOrder.items.map((item: any) => ({
    id: item.id.toString(),
    name: item.name,
    quantity: item.quantity,
    notes: item.notes || undefined,
    status: mapApiStatusToOrderStatus(item.status),
    updatedAt: new Date(item.updatedAt),
  }));

  const transformedTable = {
    id: apiOrder.table.id.toString(),
    number: apiOrder.table.number,
  };

  return {
    id: apiOrder.id.toString(),
    tableId: apiOrder.tableId.toString(),
    table: transformedTable,
    items: transformedItems,
    totalItems: apiOrder.totalItems,
    status: mapApiStatusToOrderStatus(apiOrder.status),
    createdAt: new Date(apiOrder.createdAt),
    updatedAt: new Date(apiOrder.updatedAt),
  };
};

const TableDetailPage = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTableData = async () => {
      if (!tableId) return;
      
      try {
        setLoading(true);
        setError(null);

        // tableIdは実際にはtableNumberとして扱う
        // そのテーブル番号の注文一覧を取得
        const ordersResponse = await getTableOrders(Number(tableId));
        if (!ordersResponse.success) {
          setError(ordersResponse.error || "注文情報の取得に失敗しました");
          return;
        }


        // テーブルの全注文を取得
        if (ordersResponse.data && ordersResponse.data.length > 0) {

          try {
            const transformedOrders = ordersResponse.data.map(transformApiOrderToOrder);

            setOrders(transformedOrders);
          } catch (transformError) {
            console.error("Error transforming orders:", transformError);
            setError("注文データの変換中にエラーが発生しました");
          }
        } else {

          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching table data:", error);
        setError("データの取得中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [tableId]);

  // 提供完了処理
  const handleDeliverItem = async (orderId: string, itemId: string) => {
    try {
      const response = await updateOrderItemStatus(Number(itemId), "delivered");
      
      if (response.success) {
        // ローカル状態を更新
        setOrders((prevOrders) => {
          return prevOrders.map((order) => {
            if (order.id !== orderId) return order;

            const updatedItems = order.items.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                status: "delivered" as const,
                updatedAt: new Date(),
              };
            });

            // 全てのアイテムが提供済みかチェック
            const allDelivered = updatedItems.every(
              (item) => item.status === "delivered"
            );

            return {
              ...order,
              items: updatedItems,
              status: allDelivered ? "delivered" : order.status,
              updatedAt: new Date(),
            };
          });
        });
      } else {
        console.error("Failed to deliver item:", response.error);
      }
    } catch (error) {
      console.error("Error delivering item:", error);
    }
  };

  // 会計処理
  const handleCheckout = async () => {
    if (orders.length === 0) return;
    
    try {
      // 注文データからテーブルIDを取得（最初の注文から）
      const actualTableId = Number(orders[0].table.id);

      const response = await checkoutTable(actualTableId);
      
      if (response.success) {
        // 成功時はダッシュボードに戻る
        navigate(getPath.dashboard());
      } else {
        console.error("Failed to checkout table:", response.error);
        setError(response.error || "会計処理に失敗しました");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setError("会計処理中にエラーが発生しました");
    }
  };

  // 全ての注文で全てのアイテムが提供済みかチェック
  const isTableReadyForCheckout = orders.length > 0 && orders.every(order => 
    order.items.every(item => item.status === "delivered")
  );

  // 日時のフォーマット
  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 経過時間の計算
  const calculateElapsedTime = (date: Date): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "1分未満";
    if (diffMins < 60) return `${diffMins}分`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}時間${mins}分`;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 bg-white shadow z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(getPath.dashboard())}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">テーブル詳細</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">データを読み込み中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-gray-600 mt-2">しばらく待ってから再度お試しください</p>
            </div>
          </div>
        ) : orders.length > 0 ? (
          <div className="p-4">
            {/* テーブル全体のヘッダー */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    テーブル {orders[0].table.number}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    注文数: {orders.length}件
                  </p>
                </div>
                {isTableReadyForCheckout && (
                  <button
                    onClick={handleCheckout}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    会計完了
                  </button>
                )}
              </div>
            </div>

            {/* 注文ごとの詳細表示 */}
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
                {/* 注文ヘッダー */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      注文 #{order.id.substring(0, 8)}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {order.status === "new"
                        ? "新規注文"
                        : order.status === "in-progress"
                          ? "調理中"
                          : order.status === "ready"
                            ? "提供待ち"
                            : order.status === "completed"
                              ? "調理完了"
                              : order.status === "delivered"
                                ? "提供済み"
                                : "キャンセル"}
                    </span>
                  </div>
                </div>

                {/* 注文時間情報 */}
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">注文日時:</p>
                    <p className="font-medium">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">経過時間:</p>
                    <p className="font-medium text-orange-600">
                      {calculateElapsedTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* 注文アイテムリスト */}
                <div className="mt-4">
                  <h4 className="font-medium text-md mb-3">注文アイテム</h4>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            商品名
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                            数量
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                            状態
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {item.name}
                                </span>
                                {item.notes && (
                                  <span className="text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-1 rounded">
                                    {item.notes}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-sm font-medium">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.status === "new"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.status === "in-progress"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : item.status === "ready"
                                        ? "bg-green-100 text-green-800"
                                        : item.status === "completed"
                                          ? "bg-purple-100 text-purple-800"
                                          : item.status === "delivered"
                                            ? "bg-gray-100 text-gray-800"
                                            : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.status === "new"
                                  ? "未着手"
                                  : item.status === "in-progress"
                                    ? "調理中"
                                    : item.status === "ready"
                                      ? "提供待ち"
                                      : item.status === "completed"
                                        ? "調理完了"
                                        : item.status === "delivered"
                                          ? "提供済み"
                                          : "キャンセル"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* アクションボタン - 提供待ちアイテム用 */}
                {order.items.some((item) => item.status === "ready" || item.status === "completed") && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      提供待ちアイテム操作
                    </h5>
                    <div className="space-y-2">
                      {order.items
                        .filter((item) => item.status === "ready" || item.status === "completed")
                        .map((item) => (
                          <div
                            key={`action-${item.id}`}
                            className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                              <span className="ml-2 text-xs bg-green-100 px-2 py-0.5 rounded-full text-green-800">
                                ×{item.quantity}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleDeliverItem(order.id, item.id)
                                }
                                className="px-4 py-1.5 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                              >
                                提供完了
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 注文ステータスの概要 */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-gray-700 text-sm mb-2">
                      提供ステータス
                    </h5>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>提供済み:</span>
                        <span className="font-semibold text-gray-600">
                          {order.items
                            .filter((item) => item.status === "delivered")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>提供待ち:</span>
                        <span className="font-semibold text-green-600">
                          {order.items
                            .filter((item) => item.status === "ready" || item.status === "completed")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>調理中:</span>
                        <span className="font-semibold text-yellow-600">
                          {order.items
                            .filter(
                              (item) =>
                                item.status === "in-progress" ||
                                item.status === "new"
                            )
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-gray-700 text-sm mb-2">
                      合計
                    </h5>
                    <div className="text-lg font-bold">{order.items.reduce((sum, item) => sum + item.quantity, 0)}点</div>
                    <p className="text-xs text-gray-500 mt-1">
                      最終更新: {formatDateTime(order.updatedAt).split(" ")[1]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">このテーブルには現在進行中の注文がありません</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableDetailPage;
