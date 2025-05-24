import React from "react";
import { ProgressData } from "../types/order";
import ProgressBar from "./ProgressBar";

interface ProgressCardProps {
  progressData: ProgressData;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ progressData }) => {
  const {
    tableNumber,
    area,
    totalItems,
    completedItems,
    inProgressItems,
    pendingItems,
    startTime,
  } = progressData;

  // 開始時間からの経過時間を計算
  const calculateElapsedTime = (startTime: Date): string => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}分`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}時間${mins}分`;
    }
  };

  // 開始時間をフォーマット
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 進捗率を計算
  const calculateProgress = (): number => {
    if (totalItems === 0) return 0;
    return Math.round((completedItems / totalItems) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">テーブル {tableNumber}</h3>
          <p className="text-gray-600 text-sm">{area}</p>
        </div>
        <div className="text-right">
          <span className="text-gray-700 font-medium">
            進捗: {calculateProgress()}%
          </span>
          <p className="text-gray-500 text-xs">
            開始: {formatTime(startTime)} ({calculateElapsedTime(startTime)})
          </p>
        </div>
      </div>

      <div className="mb-2">
        <ProgressBar
          completed={completedItems}
          inProgress={inProgressItems}
          pending={pendingItems || 0}
          total={totalItems}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm mt-3">
        <div className="bg-yellow-100 p-1 rounded">
          <span className="block text-yellow-800 font-medium">
            {pendingItems}
          </span>
          <span className="text-yellow-600 text-xs">保留中</span>
        </div>
        <div className="bg-blue-100 p-1 rounded">
          <span className="block text-blue-800 font-medium">
            {inProgressItems}
          </span>
          <span className="text-blue-600 text-xs">調理中</span>
        </div>
        <div className="bg-green-100 p-1 rounded">
          <span className="block text-green-800 font-medium">
            {completedItems}
          </span>
          <span className="text-green-600 text-xs">完了</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
