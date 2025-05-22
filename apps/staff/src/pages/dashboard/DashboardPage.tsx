import { useState, useEffect } from "react";
import { ProgressData } from "../../types/order";
import PieChart from "../../components/ui/PieChart";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";

// サンプル進捗データ（実際はAPIから取得・計算）
const sampleProgressData: ProgressData[] = [
  {
    tableId: "table1",
    tableNumber: 1,
    area: "メインフロア",
    totalItems: 5,
    completedItems: 0,
    readyItems: 2,
    pendingItems: 3,
    startTime: new Date(Date.now() - 25 * 60000), // 25分前
  },
  {
    tableId: "table2",
    tableNumber: 3,
    area: "テラス",
    totalItems: 4,
    completedItems: 0,
    readyItems: 1,
    pendingItems: 3,
    startTime: new Date(Date.now() - 15 * 60000), // 15分前
  },
  {
    tableId: "table3",
    tableNumber: 5,
    area: "個室",
    totalItems: 8,
    completedItems: 0,
    readyItems: 5,
    pendingItems: 3,
    startTime: new Date(Date.now() - 40 * 60000), // 40分前
  },
  {
    tableId: "table4",
    tableNumber: 7,
    area: "メインフロア",
    totalItems: 3,
    completedItems: 0,
    readyItems: 0,
    pendingItems: 3,
    startTime: new Date(Date.now() - 5 * 60000), // 5分前
  },
];

const DashboardPage = () => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 実際はAPIからデータを取得
    setProgressData(sampleProgressData);

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
    navigate(getPath.tableDetail(progress.tableId));
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center p-4 bg-white shadow z-10">
        <h1 className="text-2xl font-bold">スタッフモニター</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">テーブル別提供状況</h2>
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
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
