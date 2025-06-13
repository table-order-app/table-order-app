import { get, post, put, del } from "../utils/api";
import { API_CONFIG } from "../config";
import { getAuthHeaders } from "./authService";

// 型定義
export interface MenuItem {
  id: number;
  categoryId: number | null;
  name: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: Category;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuItemData {
  categoryId?: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  available?: boolean;
}

export interface UpdateMenuItemData {
  categoryId?: number;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  available?: boolean;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

/**
 * カテゴリ一覧を取得
 */
export async function getCategories() {
  return get<Category[]>("/menu/categories");
}

/**
 * カテゴリを作成
 */
export async function createCategory(data: CreateCategoryData) {
  return post<Category>("/menu/categories", data);
}

/**
 * カテゴリを更新
 */
export async function updateCategory(id: number, data: CreateCategoryData) {
  return put<Category>(`/menu/categories/${id}`, data);
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
  return get<MenuItem[]>("/menu/items");
}

/**
 * メニュー詳細を取得
 */
export async function getMenuItem(id: number) {
  return get<MenuItem>(`/menu/items/${id}`);
}

/**
 * メニューを作成（JSON）
 */
export async function createMenuItem(data: CreateMenuItemData) {
  return post<MenuItem>("/menu/items", data);
}

/**
 * メニューを作成（FormData - 画像ファイル対応）
 */
export async function createMenuItemWithFile(formData: FormData) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/menu/items-with-file`, {
      method: 'POST',
      headers: getAuthHeaders(), // Content-Typeは指定しない（ブラウザが自動設定）
      body: formData
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating menu item with file:', error);
    return {
      success: false,
      error: 'メニューの作成に失敗しました。ネットワーク接続を確認してください。'
    };
  }
}

/**
 * メニューを更新
 */
export async function updateMenuItem(id: string, data: UpdateMenuItemData) {
  return put<MenuItem>(`/menu/items/${id}`, data);
}

/**
 * メニューを削除
 */
export async function deleteMenuItem(id: string) {
  return del<void>(`/menu/items/${id}`);
}
