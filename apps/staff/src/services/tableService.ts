import { get } from "../utils/api";
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

