import React from "react";

interface ProgressBarProps {
  completed: number;
  inProgress: number;
  pending: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  inProgress,
  pending,
  total,
}) => {
  // 各ステータスの割合を計算
  const completedPercentage = (completed / total) * 100;
  const inProgressPercentage = (inProgress / total) * 100;
  const pendingPercentage = (pending / total) * 100;

  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 float-left"
        style={{ width: `${completedPercentage}%` }}
        title={`完了: ${completed}/${total}`}
      />
      <div
        className="h-full bg-blue-500 float-left"
        style={{ width: `${inProgressPercentage}%` }}
        title={`調理中: ${inProgress}/${total}`}
      />
      <div
        className="h-full bg-yellow-500 float-left"
        style={{ width: `${pendingPercentage}%` }}
        title={`保留中: ${pending}/${total}`}
      />
    </div>
  );
};

export default ProgressBar;
