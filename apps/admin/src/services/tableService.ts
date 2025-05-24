import { get, post, put, del } from "../utils/api";

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
 * テーブルを作成
 */
export async function createTable(data: any) {
  return post<any>("/table", data);
}

/**
 * テーブルを更新
 */
export async function updateTable(id: string, data: any) {
  return put<any>(`/table/${id}`, data);
}

/**
 * テーブルを削除
 */
export async function deleteTable(id: string) {
  return del<any>(`/table/${id}`);
}
