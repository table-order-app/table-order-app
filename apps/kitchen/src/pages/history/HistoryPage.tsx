import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "../../types/order";
import { getCompletedOrders } from "../../services/orderService";
import { getPath } from "../../routes";

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
        status: "completed",
        updatedAt: new Date(Date.now() - 60 * 60000), // 60分前
      },
      {
        id: "item2",
        name: "マルゲリータピザ",
        quantity: 1,
        notes: "チーズ多めで",
        status: "completed",
        updatedAt: new Date(Date.now() - 58 * 60000), // 58分前
      },
    ],
    totalItems: 3,
    status: "completed",
    createdAt: new Date(Date.now() - 65 * 60000), // 65分前
    updatedAt: new Date(Date.now() - 55 * 60000), // 55分前
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
        status: "completed",
        updatedAt: new Date(Date.now() - 120 * 60000), // 120分前
      },
      {
        id: "item4",
        name: "ガーリックブレッド",
        quantity: 1,
        status: "completed",
        updatedAt: new Date(Date.now() - 118 * 60000), // 118分前
      },
    ],
    totalItems: 2,
    status: "completed",
    createdAt: new Date(Date.now() - 125 * 60000), // 125分前
    updatedAt: new Date(Date.now() - 115 * 60000), // 115分前
  },
];

const HistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [filterArea, setFilterArea] = useState<string | "all">("all");
  
  const areas = [...new Set(orders.map((order) => order.table.area))];
  
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        
        setOrders(sampleOrders);
        setError(null);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("注文履歴の取得中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDate(e.target.value);
  };
  
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    const dateMatches = filterDate ? orderDate === filterDate : true;
    const areaMatches = filterArea === "all" || order.table.area === filterArea;
    
    return dateMatches && areaMatches;
  });
  
  const navigateToDashboard = () => {
    navigate(getPath.dashboard());
  };
  
  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">注文履歴</h1>
        <button
          onClick={navigateToDashboard}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          注文一覧に戻る
        </button>
      </div>
      
      {/* フィルター */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">フィルター</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={handleDateFilterChange}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              エリア
            </label>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">すべて</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 注文リスト */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-gray-50 text-center py-12 rounded-lg">
          <p className="text-gray-500">該当する注文履歴がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">
                      テーブル {order.table.number}
                    </h3>
                    <p className="text-sm text-gray-600">{order.table.area}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      完了
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      注文ID: {order.id.substring(0, 8)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-600">注文日時:</span>{" "}
                    {formatDateTime(order.createdAt)}
                  </div>
                  <div>
                    <span className="text-gray-600">完了日時:</span>{" "}
                    {formatDateTime(order.updatedAt)}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="font-medium mb-2">注文内容</h4>
                <ul className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-2">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-2 text-gray-600">×{item.quantity}</span>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between">
                  <span className="font-medium">合計</span>
                  <span className="font-bold">{order.totalItems}点</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
