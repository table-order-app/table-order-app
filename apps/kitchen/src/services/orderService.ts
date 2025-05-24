import { get, patch } from "../utils/api";

// API response types
export interface ApiOrder {
  id: number;
  tableId: number;
  status: string;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
  table: {
    id: number;
    number: number;
    capacity: number;
    area: string;
    status: string;
    qrCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
  items: ApiOrderItem[];
}

export interface ApiOrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  quantity: number;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 注文一覧を取得
 */
export async function getOrders() {
  return get<ApiOrder[]>("/order");
}

/**
 * 注文詳細を取得
 */
export async function getOrder(id: number) {
  return get<ApiOrder>(`/order/${id}`);
}

/**
 * 新規注文一覧を取得（調理前のもの）
 */
export async function getNewOrders() {
  return get<ApiOrder[]>("/order/status/new");
}

/**
 * 調理中の注文一覧を取得
 */
export async function getCookingOrders() {
  return get<ApiOrder[]>("/order/status/cooking");
}

/**
 * 完了した注文一覧を取得
 */
export async function getCompletedOrders() {
  return get<ApiOrder[]>("/order/status/completed");
}

/**
 * 注文ステータスを更新
 */
export async function updateOrderStatus(id: number, status: string) {
  return patch<ApiOrder>(`/order/${id}/status`, { status });
}

/**
 * 注文アイテムのステータスを更新
 */
export async function updateOrderItemStatus(itemId: number, status: string) {
  return patch<ApiOrderItem>(`/order/items/${itemId}/status`, { status });
}

/**
 * 注文を調理中に設定
 */
export async function setOrderCooking(id: number) {
  return updateOrderStatus(id, "cooking");
}

/**
 * 注文を完了に設定
 */
export async function setOrderCompleted(id: number) {
  return updateOrderStatus(id, "completed");
}

/**
 * 注文アイテムを調理中に設定
 */
export async function setOrderItemCooking(itemId: number) {
  return updateOrderItemStatus(itemId, "cooking");
}

/**
 * 注文アイテムを完了に設定
 */
export async function setOrderItemCompleted(itemId: number) {
  return updateOrderItemStatus(itemId, "completed");
}
