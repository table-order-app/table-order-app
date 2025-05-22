import { useState, useEffect } from "react";
import { Order, ProgressData } from "../../types/order";
import PieChart from "../../components/ui/PieChart";

// サンプルデータ（実際はAPIから取得）
const sampleOrders: Order[] = [
  {
    id: "order1",
    tableId: "table1",
    table: { id: "table1", number: 1, area: "メインフロア" },
    items: [
      {
        id: "item1",
        name: "シーザーサラダ",
        quantity: 2,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 10 * 60000), // 10分前
      },
      {
        id: "item2",
        name: "マルゲリータピザ",
        quantity: 1,
        notes: "チーズ多めで",
        status: "in-progress",
        updatedAt: new Date(Date.now() - 8 * 60000), // 8分前
      },
      {
        id: "item3",
        name: "スパークリングワイン",
        quantity: 2,
        status: "completed",
        updatedAt: new Date(Date.now() - 5 * 60000), // 5分前
      },
    ],
    totalItems: 5,
    status: "in-progress",
    createdAt: new Date(Date.now() - 25 * 60000), // 25分前
    updatedAt: new Date(Date.now() - 5 * 60000), // 5分前
  },
  {
    id: "order2",
    tableId: "table2",
    table: { id: "table2", number: 3, area: "テラス" },
    items: [
      {
        id: "item4",
        name: "カルボナーラ",
        quantity: 1,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 12 * 60000), // 12分前
      },
      {
        id: "item5",
        name: "ガーリックブレッド",
        quantity: 1,
        status: "completed",
        updatedAt: new Date(Date.now() - 10 * 60000), // 10分前
      },
      {
        id: "item6",
        name: "ティラミス",
        quantity: 2,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 15 * 60000), // 15分前
      },
    ],
    totalItems: 4,
    status: "in-progress",
    createdAt: new Date(Date.now() - 15 * 60000), // 15分前
    updatedAt: new Date(Date.now() - 10 * 60000), // 10分前
  },
  {
    id: "order3",
    tableId: "table3",
    table: { id: "table3", number: 5, area: "個室" },
    items: [
      {
        id: "item7",
        name: "ステーキセット",
        quantity: 3,
        notes: "ミディアムレア",
        status: "completed",
        updatedAt: new Date(Date.now() - 20 * 60000), // 20分前
      },
      {
        id: "item8",
        name: "シーフードパスタ",
        quantity: 2,
        status: "completed",
        updatedAt: new Date(Date.now() - 18 * 60000), // 18分前
      },
      {
        id: "item9",
        name: "アイスクリーム",
        quantity: 3,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 15 * 60000), // 15分前
      },
    ],
    totalItems: 8,
    status: "in-progress",
    createdAt: new Date(Date.now() - 40 * 60000), // 40分前
    updatedAt: new Date(Date.now() - 15 * 60000), // 15分前
  },
  {
    id: "order4",
    tableId: "table4",
    table: { id: "table4", number: 7, area: "メインフロア" },
    items: [
      {
        id: "item10",
        name: "ハンバーガー",
        quantity: 1,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 4 * 60000), // 4分前
      },
      {
        id: "item11",
        name: "フライドポテト",
        quantity: 1,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 5 * 60000), // 5分前
      },
      {
        id: "item12",
        name: "コーラ",
        quantity: 1,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 5 * 60000), // 5分前
      },
    ],
    totalItems: 3,
    status: "in-progress",
    createdAt: new Date(Date.now() - 5 * 60000), // 5分前
    updatedAt: new Date(Date.now() - 4 * 60000), // 4分前
  },
];

// サンプル進捗データ（実際はAPIから取得）
const sampleProgressData: ProgressData[] = [
  {
    tableId: "table1",
    tableNumber: 1,
    area: "メインフロア",
    totalItems: 5,
    completedItems: 2,
    inProgressItems: 3,
    cancelledItems: 0,
    startTime: new Date(Date.now() - 25 * 60000), // 25分前
  },
  {
    tableId: "table2",
    tableNumber: 3,
    area: "テラス",
    totalItems: 4,
    completedItems: 1,
    inProgressItems: 3,
    cancelledItems: 0,
    startTime: new Date(Date.now() - 15 * 60000), // 15分前
  },
  {
    tableId: "table3",
    tableNumber: 5,
    area: "個室",
    totalItems: 8,
    completedItems: 5,
    inProgressItems: 3,
    cancelledItems: 0,
    startTime: new Date(Date.now() - 40 * 60000), // 40分前
  },
  {
    tableId: "table4",
    tableNumber: 7,
    area: "メインフロア",
    totalItems: 3,
    completedItems: 0,
    inProgressItems: 3,
    cancelledItems: 0,
    startTime: new Date(Date.now() - 5 * 60000), // 5分前
  },
];

const DashboardPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // 実際はAPIからデータを取得
    setOrders(sampleOrders);

    // 注文データから進捗データを計算
    const initialProgressData = calculateProgressData(
      sampleOrders,
      sampleProgressData
    );
    setProgressData(initialProgressData);

    // 最初のテーブルを自動選択
    if (initialProgressData.length > 0) {
      handleProgressSelect(initialProgressData[0]);
    }

    // ポーリングで最新のデータを取得
    const intervalId = setInterval(() => {
      // 実際の実装ではここでAPIを呼び出す
      console.log("データを更新中...");
      // 最新の注文データから進捗を計算
      // setOrders(newOrdersFromAPI);
      // updateProgressDataFromOrders(newOrdersFromAPI);
    }, 10000);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, []);

  // キャンセル処理
  const handleCancelItem = (orderId: string, itemId: string) => {
    // 注文アイテムをキャンセルに更新
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        const updatedItems = order.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            status: "cancelled" as const, // 調理中 → キャンセル
            updatedAt: new Date(),
          };
        });

        // すべてのアイテムがキャンセルされたかチェック
        const allCancelled = updatedItems.every(
          (item) => item.status === "cancelled"
        );

        // 一部がキャンセルされ、残りが完了している場合
        const allCompletedOrCancelled = updatedItems.every(
          (item) => item.status === "completed" || item.status === "cancelled"
        );

        let newStatus = order.status;
        if (allCancelled) {
          newStatus = "cancelled";
        } else if (allCompletedOrCancelled) {
          newStatus = "completed";
        }

        return {
          ...order,
          items: updatedItems,
          status: newStatus,
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

      // 進捗データを更新する
      updateProgressDataFromOrders(updatedOrders);

      return updatedOrders;
    });
  };

  // 初期進捗データの計算
  const calculateProgressData = (
    ordersData: Order[],
    baseProgressData: ProgressData[]
  ): ProgressData[] => {
    return baseProgressData.map((data) => {
      const tableOrders = ordersData.filter(
        (order) => order.tableId === data.tableId
      );

      if (tableOrders.length === 0) return data;

      // 各ステータスのアイテム数を集計
      let totalItems = 0;
      let completedItems = 0;
      let inProgressItems = 0;
      let cancelledItems = 0;

      tableOrders.forEach((order) => {
        order.items.forEach((item) => {
          totalItems += item.quantity;

          if (item.status === "completed") {
            completedItems += item.quantity;
          } else if (item.status === "in-progress") {
            inProgressItems += item.quantity;
          } else if (item.status === "cancelled") {
            cancelledItems += item.quantity;
          }
        });
      });

      return {
        ...data,
        totalItems,
        completedItems,
        inProgressItems,
        cancelledItems,
      };
    });
  };

  // テーブル進捗状況をタップした時の処理
  const handleProgressSelect = (progress: ProgressData) => {
    setSelectedTable(progress.tableId);

    // そのテーブルの注文を探す
    const tableOrder = orders.find(
      (order) => order.tableId === progress.tableId
    );
    if (tableOrder) {
      setSelectedOrder(tableOrder);
    }
  };

  // 調理完了処理
  const handleCompleteItem = (orderId: string, itemId: string) => {
    // 調理中のアイテムを調理完了に更新
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        const updatedItems = order.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            status: "completed" as const, // 調理中 → 調理完了
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

      // 進捗データを更新する
      updateProgressDataFromOrders(updatedOrders);

      return updatedOrders;
    });
  };

  // 進捗データの更新（Ordersから直接計算）
  const updateProgressDataFromOrders = (currentOrders: Order[]) => {
    const updatedProgressData = progressData.map((data) => {
      const tableOrders = currentOrders.filter(
        (order) => order.tableId === data.tableId
      );

      if (tableOrders.length === 0) return data;

      // 各ステータスのアイテム数を集計
      let totalItems = 0;
      let completedItems = 0;
      let inProgressItems = 0;
      let cancelledItems = 0;

      tableOrders.forEach((order) => {
        order.items.forEach((item) => {
          totalItems += item.quantity;

          if (item.status === "completed") {
            completedItems += item.quantity;
          } else if (item.status === "in-progress") {
            inProgressItems += item.quantity;
          } else if (item.status === "cancelled") {
            cancelledItems += item.quantity;
          }
        });
      });

      return {
        ...data,
        totalItems,
        completedItems,
        inProgressItems,
        cancelledItems,
      };
    });

    setProgressData(updatedProgressData);
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

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center p-4 bg-white shadow z-10">
        <h1 className="text-2xl font-bold">キッチンモニター</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左側: テーブル進捗グラフ */}
        <div className="w-2/3 overflow-y-auto border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">テーブル別進捗状況</h2>
            <div className="grid grid-cols-2 gap-4">
              {progressData.map((data) => (
                <div
                  key={data.tableId}
                  className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${selectedTable === data.tableId ? "border-2 border-primary" : ""}`}
                  onClick={() => handleProgressSelect(data)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold">
                        テーブル {data.tableNumber}
                      </h3>
                      <p className="text-gray-600">{data.area}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">
                        {Math.round(
                          (data.completedItems / data.totalItems) * 100
                        )}
                        %
                      </span>
                      <p className="text-gray-500 text-sm">
                        開始:{" "}
                        {new Date(data.startTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* 円グラフ */}
                  <div className="flex justify-center my-3">
                    <div className="relative w-28 h-28">
                      <PieChart
                        completed={data.completedItems}
                        inProgress={data.inProgressItems}
                        cancelled={data.cancelledItems}
                        total={data.totalItems}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold">
                          {data.completedItems}/{data.totalItems}
                        </span>
                        <span className="text-xs text-gray-500">調理完了</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm mt-3">
                    <div className="bg-yellow-100 p-2 rounded">
                      <span className="block text-yellow-800 font-medium">
                        {data.inProgressItems}
                      </span>
                      <span className="text-yellow-600 text-xs">調理中</span>
                    </div>
                    <div className="bg-green-100 p-2 rounded">
                      <span className="block text-green-800 font-medium">
                        {data.completedItems}
                      </span>
                      <span className="text-green-600 text-xs">調理完了</span>
                    </div>
                    <div className="bg-red-100 p-2 rounded">
                      <span className="block text-red-800 font-medium">
                        {data.cancelledItems}
                      </span>
                      <span className="text-red-600 text-xs">キャンセル</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右側: 選択されたテーブルの詳細 */}
        <div className="w-1/3 overflow-y-auto bg-gray-50">
          {selectedOrder ? (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                {/* ヘッダー部分 */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      テーブル {selectedOrder.table.number}
                    </h2>
                    <p className="text-gray-600">{selectedOrder.table.area}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {selectedOrder.status === "in-progress"
                        ? "調理中"
                        : selectedOrder.status === "completed"
                          ? "調理完了"
                          : "キャンセル"}
                    </span>
                    <p className="text-gray-500 text-sm mt-1">
                      ID: {selectedOrder.id.substring(0, 8)}
                    </p>
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

                {/* 注文アイテムリスト */}
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-3">注文アイテム</h3>
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
                        {selectedOrder.items.map((item) => (
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
                                  item.status === "in-progress"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : item.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.status === "in-progress"
                                  ? "調理中"
                                  : item.status === "completed"
                                    ? "完了"
                                    : "キャンセル"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* アクションボタン - 調理中アイテム用 */}
                {selectedOrder.items.some(
                  (item) => item.status === "in-progress"
                ) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      調理中アイテム操作
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items
                        .filter((item) => item.status === "in-progress")
                        .map((item) => (
                          <div
                            key={`action-${item.id}`}
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
                                完了
                              </button>
                              <button
                                onClick={() =>
                                  handleCancelItem(selectedOrder.id, item.id)
                                }
                                className="px-4 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                              >
                                取消
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
                            .filter((item) => item.status === "in-progress")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>キャンセル:</span>
                        <span className="font-semibold text-red-600">
                          {selectedOrder.items
                            .filter((item) => item.status === "cancelled")
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
                      {selectedOrder.totalItems}点
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
              <p className="text-gray-500">テーブルを選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
