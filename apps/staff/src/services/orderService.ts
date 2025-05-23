import { get, put } from "../utils/api";

/**
 * 注文一覧を取得
 */
export async function getOrders() {
  return get<any[]>("/order");
}

/**
 * 注文詳細を取得
 */
export async function getOrder(id: number) {
  return get<any>(`/order/${id}`);
}

/**
 * テーブルの注文一覧を取得
 */
export async function getTableOrders(tableId: number) {
  return get<any[]>(`/order/table/${tableId}`);
}

/**
 * 注文ステータスを更新
 */
export async function updateOrderStatus(id: number, status: string) {
  return put<any>(`/order/${id}/status`, { status });
}

/**
 * 注文アイテムのステータスを更新
 */
export async function updateOrderItemStatus(itemId: number, status: string) {
  return put<any>(`/order/items/${itemId}/status`, { status });
}
