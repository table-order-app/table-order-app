import { get } from "../utils/api";
import { MenuItem } from "../types";

/**
 * カテゴリ一覧を取得
 */
export async function getCategories() {
  return get<Array<{ id: number; name: string; description?: string }>>(
    "/menu/categories"
  );
}

/**
 * カテゴリIDに基づくメニュー一覧を取得（提供中のみ）
 */
export async function getMenuItemsByCategory(categoryId: number) {
  const response = await get<MenuItem[]>("/menu/items");
  if (response.success && response.data) {
    return {
      ...response,
      data: response.data.filter(item => 
        item.categoryId === categoryId && item.available === true
      )
    };
  }
  return response;
}

/**
 * メニュー詳細を取得
 */
export async function getMenuItem(id: number) {
  return get<MenuItem>(`/menu/items/${id}`);
}
