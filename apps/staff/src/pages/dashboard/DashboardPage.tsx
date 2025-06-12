import { useState, useEffect, useCallback } from "react";
import { ProgressData, Order, OrderItem, Table } from "../../types/order";
import PieChart from "../../components/ui/PieChart";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { getOrders } from "../../services/orderService";

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

// Area code to Japanese translation
const translateAreaCode = (areaCode: string): string => {
  const areaTranslations: Record<string, string> = {
    'area1': 'メインフロア',
    'area2': 'テラス',
    'area3': '個室',
    'area4': 'カウンター',
  };
  return areaTranslations[areaCode] || areaCode;
};

// Transform API order data to UI format
const transformApiOrderToOrder = (apiOrder: any): Order => {
  const transformedItems: OrderItem[] = apiOrder.items.map((item: any) => ({
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
    area: translateAreaCode(apiOrder.table.area),
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

const DashboardPage = () => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 注文データから進捗データを計算
  const calculateProgressDataFromOrders = (ordersData: Order[]): ProgressData[] => {
    const progressMap = new Map<string, ProgressData>();

    // スタッフ用では全ての注文を表示（完了済みも含む）
    ordersData.forEach((order) => {
      if (!progressMap.has(order.tableId)) {
        progressMap.set(order.tableId, {
          tableId: order.tableId,
          tableNumber: order.table.number,
          area: order.table.area,
          totalItems: 0,
          completedItems: 0,
          readyItems: 0,
          pendingItems: 0,
          startTime: order.createdAt,
        });
      }

      const progressData = progressMap.get(order.tableId)!;

      // より古い注文があればstartTimeを更新
      if (order.createdAt < progressData.startTime) {
        progressData.startTime = order.createdAt;
      }

      // 各アイテムの状態を集計
      order.items.forEach((item) => {
        progressData.totalItems += item.quantity;

        if (item.status === "delivered") {
          progressData.completedItems += item.quantity;
        } else if (item.status === "ready") {
          progressData.readyItems += item.quantity;
        } else if (item.status === "in-progress" || item.status === "new") {
          progressData.pendingItems += item.quantity;
        }
        // cancelled items are not counted in any category
      });
    });

    return Array.from(progressMap.values()).sort((a, b) => a.tableNumber - b.tableNumber);
  };

  useEffect(() => {
    let isInitialFetch = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        if (isInitialFetch) {
          console.log("Fetching orders from API...");
        }
        
        const response = await getOrders();
        if (isInitialFetch) {
          console.log("API Response:", response);
        }

        if (response.success && response.data) {
          if (isInitialFetch) {
            console.log("Orders data received:", response.data);
          }
          const transformedOrders = response.data.map(transformApiOrderToOrder);
          
          // 注文データから進捗データを計算
          const calculatedProgressData = calculateProgressDataFromOrders(transformedOrders);
          setProgressData(calculatedProgressData);
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

  // テーブル進捗状況をタップした時の処理
  const handleProgressSelect = (progress: ProgressData) => {
    navigate(getPath.tableDetail(progress.tableId));
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center p-4 bg-white shadow z-10">
          <h1 className="text-2xl font-bold">スタッフモニター</h1>
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
          <h1 className="text-2xl font-bold">スタッフモニター</h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-600 mt-2">しばらく待ってから再度お試しください</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center p-4 bg-white shadow z-10">
        <h1 className="text-2xl font-bold">スタッフモニター</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">テーブル別提供状況</h2>
          {progressData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600">現在注文がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {progressData.map((data) => (
                <div
                  key={data.tableId}
                  className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
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
                          ((data.completedItems + data.readyItems) /
                            data.totalItems) *
                            100
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
                        ready={data.readyItems}
                        pending={data.pendingItems}
                        total={data.totalItems}
                      />
                      {/* 中央の情報表示 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold">
                          {data.readyItems}/{data.totalItems}
                        </span>
                        <span className="text-xs text-gray-500">提供待ち</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm mt-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <span className="block text-blue-800 font-medium">
                        {data.pendingItems}
                      </span>
                      <span className="text-blue-600 text-xs">調理中</span>
                    </div>
                    <div className="bg-green-100 p-2 rounded">
                      <span className="block text-green-800 font-medium">
                        {data.readyItems}
                      </span>
                      <span className="text-green-600 text-xs">提供待ち</span>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <span className="block text-gray-800 font-medium">
                        {data.completedItems}
                      </span>
                      <span className="text-gray-600 text-xs">提供済み</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
