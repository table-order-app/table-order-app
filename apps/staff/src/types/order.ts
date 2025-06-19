// 注文ステータスの型定義
export type OrderStatus =
  | "new"
  | "in-progress"
  | "ready"
  | "completed"
  | "delivered"
  | "cancelled";

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

// テーブル進捗データの型定義
export interface ProgressData {
  tableId: string;
  tableNumber: number;
  totalItems: number;
  completedItems: number; // 提供済み
  readyItems: number; // 提供準備完了
  pendingItems: number; // 調理中・未着手
  startTime: Date;
}
