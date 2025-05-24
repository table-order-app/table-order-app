import { get, post, put, del } from "../utils/api";

/**
 * スタッフ一覧を取得
 */
export async function getStaffList() {
  return get<any[]>("/staff");
}

/**
 * スタッフ詳細を取得
 */
export async function getStaffMember(id: number) {
  return get<any>(`/staff/${id}`);
}

/**
 * スタッフを作成
 */
export async function createStaffMember(data: any) {
  return post<any>("/staff", data);
}

/**
 * スタッフを更新
 */
export async function updateStaffMember(id: string, data: any) {
  return { success: true, data };
}

/**
 * スタッフを削除
 */
export async function deleteStaffMember(id: string) {
  return { success: true };
}
