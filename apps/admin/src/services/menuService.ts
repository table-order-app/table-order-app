import { get, post, put, del } from "../utils/api";

/**
 * カテゴリ一覧を取得
 */
export async function getCategories() {
  return get<Array<{ id: number; name: string; description?: string }>>(
    "/menu/categories"
  );
}

/**
 * カテゴリを作成
 */
export async function createCategory(data: { name: string; description?: string }) {
  return post<{ id: number; name: string; description?: string }>(
    "/menu/categories", 
    data
  );
}

/**
 * カテゴリを更新
 */
export async function updateCategory(id: number, data: { name: string; description?: string }) {
  return put<{ id: number; name: string; description?: string }>(
    `/menu/categories/${id}`, 
    data
  );
}

/**
 * カテゴリを削除
 */
export async function deleteCategory(id: number) {
  return del<void>(`/menu/categories/${id}`);
}

/**
 * メニュー一覧を取得
 */
export async function getMenuItems() {
  return get<any[]>("/menu/items");
}

/**
 * メニュー詳細を取得
 */
export async function getMenuItem(id: number) {
  return get<any>(`/menu/items/${id}`);
}

/**
 * メニューを作成
 */
export async function createMenuItem(data: any) {
  return post<any>("/menu/items", data);
}

/**
 * メニューを更新
 */
export async function updateMenuItem(id: string, data: any) {
  return put<any>(`/menu/items/${id}`, data);
}

/**
 * メニューを削除
 */
export async function deleteMenuItem(id: string) {
  return del<any>(`/menu/items/${id}`);
}
