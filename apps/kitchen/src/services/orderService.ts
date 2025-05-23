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
 * 新規注文一覧を取得（調理前のもの）
 */
export async function getNewOrders() {
  return get<any[]>("/order/status/new");
}

/**
 * 調理中の注文一覧を取得
 */
export async function getCookingOrders() {
  return get<any[]>("/order/status/cooking");
}

/**
 * 完了した注文一覧を取得
 */
export async function getCompletedOrders() {
  return get<any[]>("/order/status/completed");
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
