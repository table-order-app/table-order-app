import React, { useEffect, useRef } from "react";

interface PieChartProps {
  completed: number; // 提供済み
  ready: number; // 提供準備完了
  pending: number; // 調理中・未着手
  total: number;
}

const PieChart: React.FC<PieChartProps> = ({
  completed,
  ready,
  pending,
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
      completed: "#9CA3AF", // グレー (提供済み)
      ready: "#10B981", // グリーン (提供待ち)
      pending: "#3B82F6", // ブルー (調理中・未着手)
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
      { name: "ready", value: ready, color: colors.ready },
      { name: "pending", value: pending, color: colors.pending },
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
  }, [completed, ready, pending, total]);

  return <canvas ref={canvasRef} className="w-32 h-32"></canvas>;
};

export default PieChart;
