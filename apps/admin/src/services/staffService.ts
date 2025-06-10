import { get, post, put, del } from "../utils/api";

// 役割の型定義
export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleData {
  name: string;
  description: string;
  color: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
}

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

/**
 * 役割一覧を取得
 */
export async function getRoles() {
  return get<Role[]>("/staff/roles");
}

/**
 * 役割詳細を取得
 */
export async function getRole(id: string) {
  return get<Role>(`/staff/roles/${id}`);
}

/**
 * 役割を作成
 */
export async function createRole(data: CreateRoleData) {
  return post<Role>("/staff/roles", data);
}

/**
 * 役割を更新
 */
export async function updateRole(id: string, data: UpdateRoleData) {
  return put<Role>(`/staff/roles/${id}`, data);
}

/**
 * 役割を削除
 */
export async function deleteRole(id: string) {
  return del<void>(`/staff/roles/${id}`);
}
