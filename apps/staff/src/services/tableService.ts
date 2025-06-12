import { get, put } from "../utils/api";
import { getCurrentStore } from "./authService";

/**
 * テーブル一覧を取得
 */
export async function getTables() {
  const store = getCurrentStore();
  if (!store) {
    return { success: false, error: "店舗情報が取得できません" };
  }
  return get<any[]>(`/table?storeId=${store.id}`);
}

/**
 * テーブル詳細を取得
 */
export async function getTable(id: number) {
  const store = getCurrentStore();
  if (!store) {
    return { success: false, error: "店舗情報が取得できません" };
  }
  return get<any>(`/table/${id}?storeId=${store.id}`);
}

/**
 * テーブルステータスを更新
 */
export async function updateTableStatus(id: number, status: string) {
  return put<any>(`/table/${id}/status`, { status });
}

/**
 * テーブルを空席に設定
 */
export async function setTableAvailable(id: number) {
  return updateTableStatus(id, "available");
}

/**
 * テーブルを使用中に設定
 */
export async function setTableOccupied(id: number) {
  return updateTableStatus(id, "occupied");
}

/**
 * テーブルを清掃中に設定
 */
export async function setTableCleaning(id: number) {
  return updateTableStatus(id, "cleaning");
}
