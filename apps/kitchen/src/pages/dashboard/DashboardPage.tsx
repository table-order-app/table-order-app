import { useState, useEffect, useCallback } from "react";
import { Order, OrderItem, Table } from "../../types/order";
import PieChart from "../../components/ui/PieChart";
import {
  getOrders,
  updateOrderItemStatus,
  ApiOrder,
} from "../../services/orderService";
import { formatTimeJST, getElapsedMinutesJST } from "../../utils/dateUtils";

// API data transformation functions
const transformApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  const transformedItems: OrderItem[] = apiOrder.items.map((item) => ({
    id: item.id.toString(),
    name: item.name,
    quantity: item.quantity,
    notes: item.notes || undefined,
    status: mapApiStatusToOrderStatus(item.status),
    updatedAt: new Date(item.updatedAt),
  }));

  const transformedTable: Table = {
    id: apiOrder.table.id.toString(),
    number: apiOrder.table.number,
    area: apiOrder.table.area,
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

const DashboardPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleOrderSelect = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  useEffect(() => {
    let isInitialFetch = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        if (isInitialFetch) {

        }
        const response = await getOrders();
        if (isInitialFetch) {

        }

        if (response.success && response.data) {
          if (isInitialFetch) {

          }
          const transformedOrders = response.data.map(transformApiOrderToOrder);
          setOrders(transformedOrders);

          // 最初の注文を自動選択（初回のみ）
          if (
            transformedOrders.length > 0 &&
            !selectedOrder &&
            isInitialFetch
          ) {
            const firstActiveOrder = transformedOrders.find(order => 
              order.items.some(item => item.status === "new" || item.status === "in-progress")
            );
            if (firstActiveOrder) {
              setSelectedOrder(firstActiveOrder);
            }
          }
        } else {
          if (isInitialFetch) {
            console.error("API Error:", response.error);
          }
          setError(response.error || "注文データの取得に失敗しました");
        }
      } catch (error) {
        if (isInitialFetch) {
          console.error("Error fetching orders:", error);
        }
        setError(
          `注文データの取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        setLoading(false);
        isInitialFetch = false;
      }
    };

    fetchOrders();

    // ポーリングで最新のデータを取得
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000); // 10秒ごとに更新

    // クリーンアップ
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回のみ実行


  // 調理完了処理
  const handleCompleteItem = async (orderId: string, itemId: string) => {
    try {
      const response = await updateOrderItemStatus(Number(itemId), "ready");

      if (response.success) {
        // ローカル状態を更新
        setOrders((prevOrders) => {
          const updatedOrders = prevOrders.map((order) => {
            if (order.id !== orderId) return order;

            const updatedItems = order.items.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                status: "completed" as const, // UIでは完了として表示
                updatedAt: new Date(),
              };
            });

            // 全てのアイテムが調理完了かチェック
            const allCompleted = updatedItems.every(
              (item) => item.status === "completed"
            );

            return {
              ...order,
              items: updatedItems,
              status: allCompleted ? "completed" : order.status,
              updatedAt: new Date(),
            };
          });

          // 選択中の注文も更新
          if (selectedOrder && selectedOrder.id === orderId) {
            const updatedOrder = updatedOrders.find(
              (order) => order.id === orderId
            );
            if (updatedOrder) {
              setSelectedOrder(updatedOrder);
            }
          }


          return updatedOrders;
        });
      } else {
        console.error("Failed to complete item:", response.error);
      }
    } catch (error) {
      console.error("Error completing item:", error);
    }
  };

  // 調理完了の取り消し処理
  const handleUncompleteItem = async (orderId: string, itemId: string) => {
    try {
      const response = await updateOrderItemStatus(Number(itemId), "in-progress");

      if (response.success) {
        // ローカル状態を更新
        setOrders((prevOrders) => {
          const updatedOrders = prevOrders.map((order) => {
            if (order.id !== orderId) return order;

            const updatedItems = order.items.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                status: "in-progress" as const,
                updatedAt: new Date(),
              };
            });

            return {
              ...order,
              items: updatedItems,
              status: "in-progress" as const, // 1つでも調理中があれば注文全体も調理中
              updatedAt: new Date(),
            };
          });

          // 選択中の注文も更新
          if (selectedOrder && selectedOrder.id === orderId) {
            const updatedOrder = updatedOrders.find(
              (order) => order.id === orderId
            );
            if (updatedOrder) {
              setSelectedOrder(updatedOrder);
            }
          }


          return updatedOrders;
        });
      } else {
        console.error("Failed to uncomplete item:", response.error);
      }
    } catch (error) {
      console.error("Error uncompleting item:", error);
    }
  };


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

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center p-4 bg-white shadow z-10">
          <h1 className="text-2xl font-bold">キッチンモニター</h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center p-4 bg-white shadow z-10">
          <h1 className="text-2xl font-bold">キッチンモニター</h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-600 mt-2">
              しばらく待ってから再度お試しください
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-1 overflow-hidden">
        {/* 左側: 注文一覧 */}
        <div className="w-2/3 overflow-y-auto border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">調理待ち注文</h2>
            {orders.filter(order => order.items.some(item => item.status === "new" || item.status === "in-progress")).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">現在調理待ちの注文はありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {orders
                  .filter(order => order.items.some(item => item.status === "new" || item.status === "in-progress"))
                  .map((order) => {
                    const completedItems = order.items.filter(item => item.status === "completed" || item.status === "ready").reduce((sum, item) => sum + item.quantity, 0);
                    const inProgressItems = order.items.filter(item => item.status === "new" || item.status === "in-progress").reduce((sum, item) => sum + item.quantity, 0);
                    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${selectedOrder?.id === order.id ? "border-2 border-blue-500" : "border border-gray-200"}`}
                        onClick={() => handleOrderSelect(order)}
                      >
                        {/* ヘッダー部分 */}
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              テーブル {order.table.number}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              #{order.id.substring(0, 8)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeJST(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* 円グラフエリア */}
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <PieChart
                              completed={completedItems}
                              inProgress={inProgressItems}
                              cancelled={0}
                              total={totalItems}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-sm font-bold text-gray-700">
                                {completedItems}/{totalItems}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ステータス表示 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg text-center">
                            <div className="text-lg font-bold text-yellow-700">
                              {inProgressItems}
                            </div>
                            <div className="text-xs text-yellow-600">調理中</div>
                          </div>
                          <div className="bg-green-50 border border-green-200 p-2 rounded-lg text-center">
                            <div className="text-lg font-bold text-green-700">
                              {completedItems}
                            </div>
                            <div className="text-xs text-green-600">完了</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* 右側: 選択された注文の詳細 */}
        <div className="w-1/3 overflow-y-auto bg-gray-50">
          {selectedOrder ? (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                {/* 注文ヘッダー */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      テーブル {selectedOrder.table.number}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      注文 #{selectedOrder.id.substring(0, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {selectedOrder.status === "in-progress"
                        ? "調理中"
                        : selectedOrder.status === "completed"
                          ? "調理完了"
                          : "新規注文"}
                    </span>
                  </div>
                </div>

                {/* 注文時間情報 */}
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">注文日時:</p>
                    <p className="font-medium">
                      {formatDateTime(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">経過時間:</p>
                    <p className="font-medium text-orange-600">
                      {calculateElapsedTime(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>

                {/* 調理待ちアイテムリスト */}
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-3">調理待ちアイテム</h3>
                  {selectedOrder.items.filter(item => item.status === "new" || item.status === "in-progress").length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">調理待ちのアイテムはありません</p>
                    </div>
                  ) : (
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
                          {selectedOrder.items
                            .filter(item => item.status === "new" || item.status === "in-progress")
                            .map((item) => (
                            <tr key={`${selectedOrder.id}-${item.id}`} className="hover:bg-gray-50">
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
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {item.status === "new" ? "新規" : "調理中"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 調理完了アイテムリスト */}
                {selectedOrder.items.filter(item => item.status === "completed" || item.status === "ready").length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3">調理完了アイテム</h3>
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
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrder.items
                            .filter(item => item.status === "completed" || item.status === "ready")
                            .map((item) => (
                            <tr key={`completed-${selectedOrder.id}-${item.id}`} className="hover:bg-gray-50">
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
                                <button
                                  onClick={() => handleUncompleteItem(selectedOrder.id, item.id)}
                                  className="px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                >
                                  取り消し
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 調理完了ボタン */}
                {selectedOrder.items.some(
                  (item) => item.status === "in-progress" || item.status === "new"
                ) && (
                  <div className="mt-4">
                    <div className="space-y-2">
                      {selectedOrder.items
                        .filter((item) => item.status === "in-progress" || item.status === "new")
                        .map((item) => (
                          <div
                            key={`action-${selectedOrder.id}-${item.id}`}
                            className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                              <span className="ml-2 text-xs bg-yellow-100 px-2 py-0.5 rounded-full text-yellow-800">
                                ×{item.quantity}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleCompleteItem(selectedOrder.id, item.id)
                                }
                                className="px-4 py-1.5 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                              >
                                調理完了
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
                    <h4 className="font-medium text-gray-700 text-sm mb-2">
                      調理ステータス
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>調理完了:</span>
                        <span className="font-semibold text-green-600">
                          {selectedOrder.items
                            .filter((item) => item.status === "completed")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>調理中:</span>
                        <span className="font-semibold text-yellow-600">
                          {selectedOrder.items
                            .filter((item) => item.status === "in-progress" || item.status === "new")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 text-sm mb-2">
                      合計
                    </h4>
                    <div className="text-lg font-bold">
                      {selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)}点
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      最終更新:{" "}
                      {formatDateTime(selectedOrder.updatedAt).split(" ")[1]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">注文を選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;