import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Order, OrderStatus } from "../types/order";
import { getPath } from "../routes";
import { formatTimeJST, getElapsedMinutesJST } from "../utils/dateUtils";

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  showControls?: boolean;
}

const statusLabels: Record<OrderStatus, string> = {
  new: "新規注文",
  "in-progress": "調理中",
  ready: "提供準備完了",
  completed: "完了",
  delivered: "提供済み",
  cancelled: "キャンセル",
};

const statusColors: Record<OrderStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-300",
  ready: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  delivered: "bg-gray-100 text-gray-800 border-gray-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusChange,
  showControls = true,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewDetails = () => {
    // Navigate to dashboard since we simplified the kitchen app
    navigate(getPath.dashboard());
  };

  const handleStatusChange = (status: OrderStatus) => {
    if (onStatusChange) {
      onStatusChange(order.id, status);
    }
  };

  // 新しい注文から経過時間を計算（JST基準）
  const calculateElapsedTime = (date: Date) => {
    const elapsedMinutes = getElapsedMinutesJST(date);

    if (elapsedMinutes < 1) return "今";
    return `${elapsedMinutes}分前`;
  };

  return (
    <div
      className={`border-l-4 ${statusColors[order.status]} bg-white p-4 rounded shadow-md mb-4`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">
            テーブル {order.table.number}
          </h3>
          <p className="text-gray-600 text-sm">{order.table.area}</p>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
          <span className="text-gray-500 text-xs mt-1">
            {formatTimeJST(order.createdAt)} (
            {calculateElapsedTime(order.createdAt)})
          </span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium">
          注文アイテム: {order.totalItems}点
        </p>
      </div>

      {isExpanded && (
        <div className="mt-2 border-t pt-2">
          <ul className="space-y-1">
            {order.items.map((item) => (
              <li key={item.id} className="text-sm flex justify-between">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${statusColors[item.status]}`}
                >
                  {statusLabels[item.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 text-sm underline"
        >
          {isExpanded ? "閉じる" : "詳細を表示"}
        </button>

        {showControls && (
          <div className="flex space-x-2">
            {order.status === "new" && (
              <button
                onClick={() => handleStatusChange("in-progress")}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
              >
                調理開始
              </button>
            )}

            {order.status === "in-progress" && (
              <button
                onClick={() => handleStatusChange("ready")}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded"
              >
                準備完了
              </button>
            )}

            <button
              onClick={handleViewDetails}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded"
            >
              詳細
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
