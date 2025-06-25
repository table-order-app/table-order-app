import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Order, OrderStatus, ProgressData } from "../../types/order";
import { getPath } from "../../routes";
import { formatTimeJST, formatDateTimeJST } from "../../utils/dateUtils";

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
        status: "new",
        updatedAt: new Date(Date.now() - 10 * 60000), // 10分前
      },
    ],
    totalItems: 3,
    status: "new",
    createdAt: new Date(Date.now() - 10 * 60000), // 10分前
    updatedAt: new Date(Date.now() - 10 * 60000), // 10分前
  },
  {
    id: "order2",
    tableId: "table2",
    table: { id: "table2", number: 3, area: "テラス" },
    items: [
      {
        id: "item3",
        name: "カルボナーラ",
        quantity: 1,
        status: "in-progress",
        updatedAt: new Date(Date.now() - 15 * 60000), // 15分前
      },
      {
        id: "item4",
        name: "ガーリックブレッド",
        quantity: 1,
        status: "ready",
        updatedAt: new Date(Date.now() - 12 * 60000), // 12分前
      },
      {
        id: "item5",
        name: "ティラミス",
        quantity: 2,
        status: "new",
        updatedAt: new Date(Date.now() - 15 * 60000), // 15分前
      },
    ],
    totalItems: 4,
    status: "in-progress",
    createdAt: new Date(Date.now() - 15 * 60000), // 15分前
    updatedAt: new Date(Date.now() - 12 * 60000), // 12分前
  },
  {
    id: "order3",
    tableId: "table3",
    table: { id: "table3", number: 5, area: "個室" },
    items: [
      {
        id: "item6",
        name: "ステーキセット",
        quantity: 2,
        notes: "ミディアムレア",
        status: "ready",
        updatedAt: new Date(Date.now() - 25 * 60000), // 25分前
      },
      {
        id: "item7",
        name: "シーフードパスタ",
        quantity: 1,
        status: "ready",
        updatedAt: new Date(Date.now() - 20 * 60000), // 20分前
      },
    ],
    totalItems: 3,
    status: "ready",
    createdAt: new Date(Date.now() - 30 * 60000), // 30分前
    updatedAt: new Date(Date.now() - 20 * 60000), // 20分前
  },
];

// サンプル進捗データ（実際はAPIから取得）
const sampleProgressData: ProgressData[] = [
  {
    tableId: "table1",
    tableNumber: 1,
    area: "メインフロア",
    totalItems: 5,
    completedItems: 3,
    inProgressItems: 1,
    pendingItems: 1,
    cancelledItems: 0,
    startTime: new Date(Date.now() - 25 * 60000), // 25分前
  },
  {
    tableId: "table2",
    tableNumber: 3,
    area: "テラス",
    totalItems: 4,
    completedItems: 1,
    inProgressItems: 2,
    pendingItems: 1,
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
    pendingItems: 0,
    cancelledItems: 0,
    startTime: new Date(Date.now() - 40 * 60000), // 40分前
  },
];

const statusLabels: Record<OrderStatus, string> = {
  new: "新規注文",
  "in-progress": "調理中",
  ready: "提供準備完了",
  completed: "完了",
  delivered: "提供済み",
  cancelled: "キャンセル",
};

const statusColors: Record<OrderStatus, string> = {
  new: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableProgress, setTableProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    // 実際はAPIからデータを取得
    const fetchOrder = () => {
      setLoading(true);
      try {
        // ID で注文を検索
        const foundOrder = sampleOrders.find((o) => o.id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);

          // テーブルの進捗情報も取得
          const progress = sampleProgressData.find(
            (p) => p.tableId === foundOrder.tableId
          );
          if (progress) {
            setTableProgress(progress);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // ポーリングで最新のデータを取得
    const intervalId = setInterval(() => {
      fetchOrder();
    }, 10000);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, [orderId]);

  // ダッシュボードに戻る
  const navigateToDashboard = () => {
    navigate(getPath.dashboard());
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

  // 円グラフの描画
  const renderCircleProgress = (completed: number, total: number) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
      <div className="relative w-32 h-32 mx-auto my-4">
        {/* 背景の円 */}
        <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>

        {/* 進捗を示す円 - 割合に応じたスタイルを適用 */}
        {completed > 0 && (
          <div
            className="absolute inset-0 rounded-full border-8 border-green-500"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${
                50 + 50 * Math.sin(2 * Math.PI * (completed / total))
              }% ${
                50 - 50 * Math.cos(2 * Math.PI * (completed / total))
              }%, ${completed / total > 0.5 ? "100% 50%, 50% 100%, 0% 50%," : ""} 50% 0%)`,
            }}
          ></div>
        )}

        {/* 中央の情報表示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{Math.round(percentage)}%</span>
          <span className="text-sm">
            {completed}/{total}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex justify-between items-center p-4 bg-white shadow z-10">
          <h1 className="text-2xl font-bold">キッチンモニター</h1>
          <button
            onClick={navigateToDashboard}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 shadow-sm transition-colors"
          >
            テーブル一覧に戻る
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-lg">
            <h2 className="font-bold">注文が見つかりません</h2>
            <p>指定されたIDの注文を見つけることができませんでした。</p>
            <button
              onClick={navigateToDashboard}
              className="mt-4 px-4 py-2 bg-primary text-white rounded"
            >
              注文一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center p-4 bg-white shadow z-10">
        <h1 className="text-2xl font-bold">キッチンモニター</h1>
        <button
          onClick={navigateToDashboard}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 shadow-sm transition-colors"
        >
          テーブル一覧に戻る
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左側: 注文詳細 */}
        <div className="w-2/3 overflow-y-auto">
          <div className="p-4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    テーブル {order.table.number}
                  </h2>
                  <p className="text-gray-600">{order.table.area}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                  <p className="text-gray-500 text-sm mt-1">
                    注文ID: {order.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">注文日時:</p>
                  <p className="font-medium">
                    {formatDateTimeJST(order.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({calculateElapsedTime(order.createdAt)}前)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">最終更新:</p>
                  <p className="font-medium">
                    {formatDateTimeJST(order.updatedAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({calculateElapsedTime(order.updatedAt)}前)
                  </p>
                </div>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          数量
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          備考
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状態
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          更新時間
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.quantity}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="text-sm text-gray-500">
                              {item.notes || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[item.status]}`}
                            >
                              {statusLabels[item.status]}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTimeJST(item.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右側: テーブル進捗情報 */}
        <div className="w-1/3 bg-gray-50 overflow-y-auto border-l border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">テーブル進捗状況</h2>

            {tableProgress ? (
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      テーブル {tableProgress.tableNumber}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {tableProgress.area}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">
                      開始時間: {formatTimeJST(tableProgress.startTime)}
                    </p>
                  </div>
                </div>

                {/* 円グラフによる進捗表示 */}
                {renderCircleProgress(
                  tableProgress.completedItems,
                  tableProgress.totalItems
                )}

                <div className="grid grid-cols-3 gap-2 text-center text-sm mt-4">
                  <div className="bg-yellow-100 p-2 rounded">
                    <span className="block text-yellow-800 font-medium">
                      {tableProgress.pendingItems}
                    </span>
                    <span className="text-yellow-600 text-xs">保留中</span>
                  </div>
                  <div className="bg-blue-100 p-2 rounded">
                    <span className="block text-blue-800 font-medium">
                      {tableProgress.inProgressItems}
                    </span>
                    <span className="text-blue-600 text-xs">調理中</span>
                  </div>
                  <div className="bg-green-100 p-2 rounded">
                    <span className="block text-green-800 font-medium">
                      {tableProgress.completedItems}
                    </span>
                    <span className="text-green-600 text-xs">完了</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-gray-500">テーブル進捗情報がありません</p>
              </div>
            )}

            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-lg mb-2">テーブル注文状況</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span>合計アイテム数:</span>
                  <span className="font-semibold">{order.totalItems}点</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span>調理完了アイテム:</span>
                  <span className="font-semibold text-green-600">
                    {order.items
                      .filter((item) => item.status === "ready")
                      .reduce((sum, item) => sum + item.quantity, 0)}
                    点
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span>調理中アイテム:</span>
                  <span className="font-semibold text-blue-600">
                    {order.items
                      .filter((item) => item.status === "in-progress")
                      .reduce((sum, item) => sum + item.quantity, 0)}
                    点
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span>未着手アイテム:</span>
                  <span className="font-semibold text-yellow-600">
                    {order.items
                      .filter((item) => item.status === "new")
                      .reduce((sum, item) => sum + item.quantity, 0)}
                    点
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
