import { API_CONFIG } from "../config";

/**
 * APIレスポンスの共通型定義
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * API呼び出しのベース関数
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return {
      success: false,
      error: "APIリクエストに失敗しました。ネットワーク接続を確認してください。",
    };
  }
}

/**
 * GETリクエスト
 */
export function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint);
}

/**
 * POSTリクエスト
 */
export function post<T>(
  endpoint: string,
  data: any
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PUTリクエスト
 */
export function put<T>(
  endpoint: string,
  data: any
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * DELETEリクエスト
 */
export function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: "DELETE",
  });
}
