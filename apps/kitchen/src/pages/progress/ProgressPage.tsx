import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressData } from "../../types/order";
import ProgressCard from "../../components/ProgressCard";
import { getPath } from "../../routes";

// サンプルデータ（実際はAPIから取得）
const sampleProgressData: ProgressData[] = [
  {
    tableId: "table1",
    tableNumber: 1,
    area: "メインフロア",
    totalItems: 5,
    completedItems: 3,
    inProgressItems: 1,
    pendingItems: 1,
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

const ProgressPage = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [filterArea, setFilterArea] = useState<string | "all">("all");

  // 使用可能なエリアのリストを生成
  const areas = [...new Set(sampleProgressData.map((data) => data.area))];

  useEffect(() => {
    // 実際はAPIからデータを取得
    setProgressData(sampleProgressData);

    // 定期的に進捗データを更新
    const intervalId = setInterval(() => {
      // 実際の実装ではここでAPIを呼び出す
      console.log("進捗データを更新中...");
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // フィルタリングされたプログレスデータ
  const filteredProgressData =
    filterArea === "all"
      ? progressData
      : progressData.filter((data) => data.area === filterArea);

  // ダッシュボードに戻る
  const navigateToDashboard = () => {
    navigate(getPath.dashboard());
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">テーブル別進捗状況</h1>
        <button
          onClick={navigateToDashboard}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          注文一覧に戻る
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          エリアでフィルタ:
        </label>
        <div className="flex space-x-2 flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-lg ${
              filterArea === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            onClick={() => setFilterArea("all")}
          >
            すべて
          </button>

          {areas.map((area) => (
            <button
              key={area}
              className={`px-4 py-2 rounded-lg ${
                filterArea === area
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              onClick={() => setFilterArea(area)}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProgressData.length > 0 ? (
          filteredProgressData.map((data) => (
            <ProgressCard key={data.tableId} progressData={data} />
          ))
        ) : (
          <div className="col-span-3 text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">表示する進捗データがありません</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">凡例</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 mr-2"></div>
            <span className="text-sm">
              未着手: 注文はまだ調理が開始されていません
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 mr-2"></div>
            <span className="text-sm">調理中: 現在調理が進行中です</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 mr-2"></div>
            <span className="text-sm">完了: 提供準備が完了しています</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
