import { get, post, put, del } from "../utils/api";

/**
 * スタッフ一覧を取得
 */
export async function getStaffList() {
  return get<any[]>("/staff");
}

/**
 * スタッフ一覧を取得 (別名)
 */
export async function getStaffMembers() {
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
  return put<any>(`/staff/${id}`, data);
}

/**
 * スタッフを削除
 */
export async function deleteStaffMember(id: string) {
  return del<any>(`/staff/${id}`);
}
