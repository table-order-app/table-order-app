import { get, put } from "../utils/api";

/**
 * テーブル一覧を取得
 */
export async function getTables() {
  return get<any[]>("/table");
}

/**
 * テーブル詳細を取得
 */
export async function getTable(id: number) {
  return get<any>(`/table/${id}`);
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
