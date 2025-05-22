import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { Order } from "../../types/order";

// サンプルデータ - 実際はAPIから取得
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

const TableDetailPage = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    // テーブルIDから注文を取得
    const foundOrder = sampleOrders.find((o) => o.tableId === tableId);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [tableId]);

  // 提供完了処理
  const handleDeliverItem = (orderId: string, itemId: string) => {
    // 注文アイテムを提供済みにする
    setOrder((prevOrder) => {
      if (!prevOrder || prevOrder.id !== orderId) return prevOrder;

      const updatedItems = prevOrder.items.map((item) => {
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
        ...prevOrder,
        items: updatedItems,
        status: allDelivered ? "delivered" : prevOrder.status,
        updatedAt: new Date(),
      };
    });
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
        {order ? (
          <div className="p-4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {/* ヘッダー部分 */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    テーブル {order.table.number}
                  </h2>
                  <p className="text-gray-600">{order.table.area}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {order.status === "new"
                      ? "新規注文"
                      : order.status === "in-progress"
                        ? "調理中"
                        : order.status === "ready"
                          ? "提供待ち"
                          : order.status === "delivered"
                            ? "提供済み"
                            : "キャンセル"}
                  </span>
                  <p className="text-gray-500 text-sm mt-1">
                    ID: {order.id.substring(0, 8)}
                  </p>
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
              {order.items.some((item) => item.status === "ready") && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    提供待ちアイテム操作
                  </h4>
                  <div className="space-y-2">
                    {order.items
                      .filter((item) => item.status === "ready")
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
                  <h4 className="font-medium text-gray-700 text-sm mb-2">
                    提供ステータス
                  </h4>
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
                          .filter((item) => item.status === "ready")
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
                  <h4 className="font-medium text-gray-700 text-sm mb-2">
                    合計
                  </h4>
                  <div className="text-lg font-bold">{order.totalItems}点</div>
                  <p className="text-xs text-gray-500 mt-1">
                    最終更新: {formatDateTime(order.updatedAt).split(" ")[1]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">テーブル情報を読み込み中...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableDetailPage;
