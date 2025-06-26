import { useState, useEffect } from "react";
import { ProgressData, Order, OrderItem, Table } from "../../types/order";
import PieChart from "../../components/ui/PieChart";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";
import { getOrders, getCheckoutRequestedTables, checkoutTable } from "../../services/orderService";
import { calculateTableBillingTotal, formatPrice, ApiOrder } from "../../utils/billingUtils";

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
  const [checkoutRequestedTables, setCheckoutRequestedTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const navigate = useNavigate();

  // 注文データから進捗データを計算（課金情報を含む）
  const calculateProgressDataFromOrders = (ordersData: Order[], apiOrdersData: ApiOrder[]): ProgressData[] => {
    const progressMap = new Map<string, ProgressData>();
    const apiOrdersMap = new Map<string, ApiOrder[]>();

    // APIデータをテーブル別にグループ化
    apiOrdersData.forEach(apiOrder => {
      const tableId = apiOrder.tableId.toString();
      if (!apiOrdersMap.has(tableId)) {
        apiOrdersMap.set(tableId, []);
      }
      apiOrdersMap.get(tableId)!.push(apiOrder);
    });

    // アクティブな注文のみを表示（提供済み以外）
    // または、提供済みでも一部のアイテムがまだ未完了の注文を含む
    const activeOrders = ordersData.filter(order => {
      if (order.status !== "delivered") {
        return true;
      }
      // 注文ステータスが"delivered"でも、個別アイテムに未提供のものがある場合は表示
      return order.items.some(item => item.status !== "delivered");
    });
    
    activeOrders.forEach((order) => {
      if (!progressMap.has(order.tableId)) {
        // 課金情報を計算
        const tableApiOrders = apiOrdersMap.get(order.tableId) || [];
        const billing = calculateTableBillingTotal(tableApiOrders);
        
        progressMap.set(order.tableId, {
          tableId: order.tableId,
          tableNumber: order.table.number,
          totalItems: 0,
          completedItems: 0,
          readyItems: 0,
          pendingItems: 0,
          startTime: order.createdAt,
          billing: billing
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
        } else if (item.status === "ready" || item.status === "completed") {
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

        }
        
        // 注文データと会計要請テーブルを並行取得
        const [ordersResponse, checkoutTablesResponse] = await Promise.all([
          getOrders(),
          getCheckoutRequestedTables()
        ]);
        
        if (isInitialFetch) {


        }

        if (ordersResponse.success && ordersResponse.data) {
          if (isInitialFetch) {

          }
          const transformedOrders = ordersResponse.data.map(transformApiOrderToOrder);
          
          // 注文データから進捗データを計算（課金情報を含む）
          const calculatedProgressData = calculateProgressDataFromOrders(transformedOrders, ordersResponse.data);
          setProgressData(calculatedProgressData);
        } else {
          if (isInitialFetch) {
            console.error("Orders API Error:", ordersResponse.error);
          }
          setError(ordersResponse.error || "注文データの取得に失敗しました");
        }

        // 会計要請テーブルの設定
        if (checkoutTablesResponse.success && checkoutTablesResponse.data) {
          setCheckoutRequestedTables(checkoutTablesResponse.data);
        } else {
          console.error("Checkout tables error:", checkoutTablesResponse.error);
        }
      } catch (error) {
        if (isInitialFetch) {
          console.error("Error fetching data:", error);
        }
        setError(
          `データの取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
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
    navigate(getPath.tableDetail(progress.tableNumber.toString()));
  };

  // 会計確認モーダルを開く
  const handleCheckoutClick = (table: any) => {
    setSelectedTable(table);
    setShowCheckoutModal(true);
  };

  // 会計処理を実行
  const handleCheckoutConfirm = async () => {
    if (!selectedTable) return;
    
    try {
      setShowCheckoutModal(false);
      
      const response = await checkoutTable(selectedTable.id);
      
      if (response.success) {
        // 成功時はリストから削除するため、データを再取得
        const checkoutTablesResponse = await getCheckoutRequestedTables();
        if (checkoutTablesResponse.success) {
          setCheckoutRequestedTables(checkoutTablesResponse.data || []);
        }
        
        // 進捗データも更新
        const ordersResponse = await getOrders();
        if (ordersResponse.success && ordersResponse.data) {
          const transformedOrders = ordersResponse.data.map(transformApiOrderToOrder);
          const calculatedProgressData = calculateProgressDataFromOrders(transformedOrders, ordersResponse.data);
          setProgressData(calculatedProgressData);
        }
      } else {
        console.error("Failed to checkout table:", response.error);
        setError(response.error || "会計処理に失敗しました");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setError("会計処理中にエラーが発生しました");
    } finally {
      setSelectedTable(null);
    }
  };

  // 会計をキャンセル
  const handleCheckoutCancel = () => {
    setShowCheckoutModal(false);
    setSelectedTable(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center p-5 bg-white shadow z-10">
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
        <div className="flex items-center p-5 bg-white shadow z-10">
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
      <div className="flex items-center p-5 bg-white shadow z-10">
        <h1 className="text-2xl font-bold">スタッフモニター</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {/* 会計要請されたテーブル */}
          {checkoutRequestedTables.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">🔔 会計要請テーブル</h2>
              <div className="grid grid-cols-1 gap-4">
                {checkoutRequestedTables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-red-50 border border-red-200 rounded-xl p-5 flex justify-between items-center min-h-[80px]"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-red-800">
                        テーブル {table.number}
                      </h3>
                      <p className="text-red-600 text-base">
                        要請時刻: {new Date(table.checkoutRequestedAt).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCheckoutClick(table)}
                      className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[100px] text-base"
                    >
                      会計完了
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {progressData.map((data) => (
                <div
                  key={data.tableId}
                  className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-all active:scale-95 min-h-[280px]"
                  onClick={() => handleProgressSelect(data)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">
                        テーブル {data.tableNumber}
                      </h3>
                      <p className="text-gray-500 text-sm">スタッフエリア</p>
                      {/* 課金情報を表示 */}
                      {data.billing && (
                        <p className="text-orange-600 font-bold text-xl mt-2">
                          {formatPrice(data.billing.total)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.round(
                          ((data.completedItems + data.readyItems) /
                            data.totalItems) *
                            100
                        )}
                        %
                      </span>
                      <p className="text-gray-500 text-sm mt-1">
                        開始:{" "}
                        {new Date(data.startTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* 円グラフ */}
                  <div className="flex justify-center my-4">
                    <div className="relative">
                      <PieChart
                        completed={data.completedItems}
                        ready={data.readyItems}
                        pending={data.pendingItems}
                        total={data.totalItems}
                      />
                      {/* 中央の情報表示 */}
                      <div className="absolute inset-0 w-32 h-32 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold">
                          {data.readyItems}/{data.totalItems}
                        </span>
                        <span className="text-sm text-gray-500">提供待ち</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center mt-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <span className="block text-blue-800 font-bold text-lg">
                        {data.pendingItems}
                      </span>
                      <span className="text-blue-600 text-sm">調理中</span>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="block text-green-800 font-bold text-lg">
                        {data.readyItems}
                      </span>
                      <span className="text-green-600 text-sm">提供待ち</span>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <span className="block text-gray-800 font-bold text-lg">
                        {data.completedItems}
                      </span>
                      <span className="text-gray-600 text-sm">提供済み</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 会計確認モーダル */}
      {showCheckoutModal && selectedTable && (
        <div className="fixed inset-0 bg-gray-300 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">会計確認</h3>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                テーブル {selectedTable.number} の会計を完了しますか？
              </p>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  お客様から会計を要請されています
                </p>
                <p className="text-xs text-red-500 mt-1">
                  要請時刻: {new Date(selectedTable.checkoutRequestedAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCheckoutCancel}
                className="px-5 py-2.5 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleCheckoutConfirm}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                会計完了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
