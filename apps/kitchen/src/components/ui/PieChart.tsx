import React, { useEffect, useRef } from "react";

interface PieChartProps {
  completed: number; // 調理完了
  inProgress: number; // 調理中
  cancelled?: number; // キャンセル
  total: number; // 合計
}

const PieChart: React.FC<PieChartProps> = ({
  completed,
  inProgress,
  cancelled = 0,
  total,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバスサイズを設定（高解像度ディスプレイ対応）
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 高解像度対応のためのスケーリング
    ctx.scale(dpr, dpr);

    // キャンバスのサイズを設定
    const size = rect.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10; // 少し余白を取る

    // カラーパレット
    const colors = {
      completed: "#10B981", // グリーン (調理完了)
      inProgress: "#F59E0B", // オレンジ (調理中)
      cancelled: "#EF4444", // レッド (キャンセル)
      empty: "#E5E7EB", // ライトグレー (空)
    };

    // キャンバスをクリア
    ctx.clearRect(0, 0, size, size);

    // アイテムの合計が0の場合、グレーの円を描画
    if (total === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = colors.empty;
      ctx.fill();
      return;
    }

    // 各ステータスの割合を計算
    const segments = [
      { name: "completed", value: completed, color: colors.completed },
      { name: "inProgress", value: inProgress, color: colors.inProgress },
      { name: "cancelled", value: cancelled, color: colors.cancelled },
    ].filter((segment) => segment.value > 0);

    // 円グラフを描画
    let startAngle = -Math.PI / 2; // 12時の位置から開始
    segments.forEach((segment) => {
      const sliceAngle = (segment.value / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // 中央に円を描画（ドーナツチャート風に）
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  }, [completed, inProgress, cancelled, total]);

  return <canvas ref={canvasRef} className="w-28 h-28"></canvas>;
};

export default PieChart;
