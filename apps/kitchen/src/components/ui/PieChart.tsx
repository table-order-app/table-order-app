import React from "react";

interface PieChartProps {
  completed: number;
  inProgress: number;
  pending: number;
  total: number;
}

const PieChart: React.FC<PieChartProps> = ({
  completed,
  inProgress,
  pending,
  total,
}) => {
  // 値が有効でない場合は均等に分割する
  if (total <= 0 || !Number.isFinite(total)) {
    completed = inProgress = pending = 1;
    total = 3;
  }

  // 円グラフのセグメントを計算する
  const calculateSegment = (value: number, startAngle: number) => {
    const angle = (value / total) * 360;
    const endAngle = startAngle + angle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return {
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      angle,
      endAngle: startAngle + angle,
    };
  };

  let startAngle = 0;

  // 各セグメントを計算
  const completedSegment = calculateSegment(completed, startAngle);
  startAngle = completedSegment.endAngle;

  const inProgressSegment = calculateSegment(inProgress, startAngle);
  startAngle = inProgressSegment.endAngle;

  const pendingSegment = calculateSegment(pending, startAngle);

  return (
    <div className="relative w-full h-full">
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* ペンディング（未着手）セグメント - 黄色 */}
        {pending > 0 && (
          <path
            d={pendingSegment.path}
            fill="#fef08a"
            stroke="#eab308"
            strokeWidth="1"
          />
        )}

        {/* 進行中セグメント - 青色 */}
        {inProgress > 0 && (
          <path
            d={inProgressSegment.path}
            fill="#93c5fd"
            stroke="#3b82f6"
            strokeWidth="1"
          />
        )}

        {/* 完了セグメント - 緑色 */}
        {completed > 0 && (
          <path
            d={completedSegment.path}
            fill="#86efac"
            stroke="#22c55e"
            strokeWidth="1"
          />
        )}

        {/* 中央の円（見た目を良くするため） */}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
    </div>
  );
};

export default PieChart;
