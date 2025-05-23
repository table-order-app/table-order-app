// 注文状態の型定義
export type OrderStatus = "new" | "in-progress" | "ready" | "completed" | "delivered" | "cancelled";

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
  cancelledItems: number;
  pendingItems?: number; // 未着手アイテム数（オプショナル）
  startTime: Date;
}
