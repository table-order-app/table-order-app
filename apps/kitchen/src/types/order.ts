// 注文状態の型定義
export type OrderStatus =
  | "new" // 新規注文
  | "in-progress" // 調理中
  | "ready" // 提供準備完了
  | "delivered" // 提供済み
  | "cancelled"; // キャンセル

// 注文アイテムの型定義
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: OrderStatus;
  updatedAt: Date;
}

// テーブル情報の型定義
export interface Table {
  id: string;
  number: number;
  area: string;
}

// 注文の型定義
export interface Order {
  id: string;
  tableId: string;
  table: Table;
  items: OrderItem[];
  totalItems: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 進捗データの型定義
export interface ProgressData {
  tableId: string;
  tableNumber: number;
  area: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingItems: number;
  startTime: Date;
  estimatedCompletionTime?: Date;
}
