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
        status: "new",
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
        status: "ready",
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
        status: "ready",
        updatedAt: new Date(Date.now() - 10 * 60000), // 10分前
      },
      {
        id: "item6",
        name: "ティラミス",
        quantity: 2,
        status: "new",
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
        status: "ready",
        updatedAt: new Date(Date.now() - 20 * 60000), // 20分前
      },
      {
        id: "item8",
        name: "シーフードパスタ",
        quantity: 2,
        status: "ready",
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
        status: "new",
        updatedAt: new Date(Date.now() - 5 * 60000), // 5分前
      },
      {
        id: "item12",
        name: "コーラ",
        quantity: 1,
        status: "new",
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
    inProgressItems: 1,
    pendingItems: 2,
    startTime: new Date(Date.now() - 25 * 60000), // 25分前
  },
  {
    tableId: "table2",
    tableNumber: 3,
    area: "テラス",
    totalItems: 4,
    completedItems: 1,
    inProgressItems: 1,
    pendingItems: 2,
    startTime: new Date(Date.now() - 15 * 60000), // 15分前
  },
  {
    tableId: "table3",
    tableNumber: 5,
    area: "個室",
    totalItems: 8,
    completedItems: 5,
    inProgressItems: 3,
    pendingItems: 0,
    startTime: new Date(Date.now() - 40 * 60000), // 40分前
  },
  {
    tableId: "table4",
    tableNumber: 7,
    area: "メインフロア",
    totalItems: 3,
    completedItems: 0,
    inProgressItems: 1,
    pendingItems: 2,
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
    setProgressData(sampleProgressData);

    // 最初のテーブルを自動選択
    if (sampleProgressData.length > 0) {
      handleProgressSelect(sampleProgressData[0]);
    }

    // ポーリングで最新のデータを取得
    const intervalId = setInterval(() => {
      // 実際の実装ではここでAPIを呼び出す
      console.log("データを更新中...");
    }, 10000);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, []);

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
                        pending={data.pendingItems}
                        total={data.totalItems}
                      />
                      {/* 中央の情報表示 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold">
                          {data.completedItems}/{data.totalItems}
                        </span>
                        <span className="text-xs text-gray-500">完了</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm mt-3">
                    <div className="bg-yellow-100 p-2 rounded">
                      <span className="block text-yellow-800 font-medium">
                        {data.pendingItems}
                      </span>
                      <span className="text-yellow-600 text-xs">未着手</span>
                    </div>
                    <div className="bg-blue-100 p-2 rounded">
                      <span className="block text-blue-800 font-medium">
                        {data.inProgressItems}
                      </span>
                      <span className="text-blue-600 text-xs">調理中</span>
                    </div>
                    <div className="bg-green-100 p-2 rounded">
                      <span className="block text-green-800 font-medium">
                        {data.completedItems}
                      </span>
                      <span className="text-green-600 text-xs">完了</span>
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
                <div className="flex justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      テーブル {selectedOrder.table.number}
                    </h2>
                    <p className="text-gray-600">{selectedOrder.table.area}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {selectedOrder.status === "new"
                        ? "新規注文"
                        : selectedOrder.status === "in-progress"
                          ? "調理中"
                          : selectedOrder.status === "ready"
                            ? "提供準備完了"
                            : selectedOrder.status === "delivered"
                              ? "提供済み"
                              : "キャンセル"}
                    </span>
                    <p className="text-gray-500 text-sm mt-1">
                      注文ID: {selectedOrder.id}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600">注文日時:</p>
                  <p className="font-medium">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({calculateElapsedTime(selectedOrder.createdAt)}前)
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">注文アイテム</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            商品名
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            数量
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            状態
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {item.name}
                                </span>
                                {item.notes && (
                                  <span className="text-xs text-gray-500">
                                    メモ: {item.notes}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="text-sm">{item.quantity}</span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.status === "new"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : item.status === "in-progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {item.status === "new"
                                  ? "未着手"
                                  : item.status === "in-progress"
                                    ? "調理中"
                                    : "完了"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      調理ステータス
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>調理完了:</span>
                        <span className="font-semibold text-green-600">
                          {selectedOrder.items
                            .filter((item) => item.status === "ready")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>調理中:</span>
                        <span className="font-semibold text-blue-600">
                          {selectedOrder.items
                            .filter((item) => item.status === "in-progress")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>未着手:</span>
                        <span className="font-semibold text-yellow-600">
                          {selectedOrder.items
                            .filter((item) => item.status === "new")
                            .reduce((sum, item) => sum + item.quantity, 0)}
                          点
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">合計</h4>
                    <div className="text-lg font-bold">
                      {selectedOrder.totalItems}点
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      最終更新: {formatDateTime(selectedOrder.updatedAt)}
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
