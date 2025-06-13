import { get, patch, post } from "../utils/api";
import { getCurrentStore } from "./authService";

/**
 * 注文一覧を取得
 */
export async function getOrders() {
  const store = getCurrentStore();
  if (!store) {
    return { success: false, error: "店舗情報が取得できません" };
  }
  return get<any[]>(`/order?storeId=${store.id}`);
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
export async function getTableOrders(tableNumber: number) {
  return get<any[]>(`/order/table/${tableNumber}`);
}

/**
 * 注文ステータスを更新
 */
export async function updateOrderStatus(id: number, status: string) {
  return patch<any>(`/order/${id}/status`, { status });
}

/**
 * 注文アイテムのステータスを更新
 */
export async function updateOrderItemStatus(itemId: number, status: string) {
  return patch<any>(`/order/items/${itemId}/status`, { status });
}

/**
 * テーブル会計処理（テーブルIDで直接）
 */
export async function checkoutTable(tableId: number) {
  const store = getCurrentStore();
  if (!store) {
    return { success: false, error: "店舗情報が取得できません" };
  }
  
  return post<any>(`/table/${tableId}/checkout?storeId=${store.id}`, {});
}

/**
 * 会計要請されたテーブル一覧を取得
 */
export async function getCheckoutRequestedTables() {
  const store = getCurrentStore();
  if (!store) {
    return { success: false, error: "店舗情報が取得できません" };
  }
  
  return get<any[]>(`/table?storeId=${store.id}&checkoutRequested=true`);
}
