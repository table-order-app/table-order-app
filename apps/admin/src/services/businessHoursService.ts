import { API_CONFIG } from '../config';

export interface BusinessHours {
  openTime: string;
  closeTime: string;
  isNextDay: boolean;
  timezone: string;
  accountingDayStart: string;
}

export interface BusinessHoursInput {
  openTime: string;
  closeTime: string;
}

/**
 * 営業時間を取得
 */
export async function getBusinessHours(): Promise<BusinessHours> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('認証トークンが見つかりません');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}/store/business-hours`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '営業時間の取得に失敗しました');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '営業時間の取得に失敗しました');
  }

  return data.data;
}

/**
 * 営業時間を更新
 */
export async function updateBusinessHours(businessHours: BusinessHoursInput): Promise<BusinessHours> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('認証トークンが見つかりません');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}/store/business-hours`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(businessHours),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '営業時間の更新に失敗しました');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '営業時間の更新に失敗しました');
  }

  return data.data;
}

/**
 * 営業時間の表示文字列を作成
 */
export function formatBusinessHours(hours: BusinessHours): string {
  if (hours.isNextDay) {
    return `${hours.openTime} 〜 ${hours.closeTime}（翌日）`;
  }
  return `${hours.openTime} 〜 ${hours.closeTime}`;
}

/**
 * 時刻入力値が有効かチェック
 */
export function validateTimeInput(time: string): boolean {
  // HH:MM形式で、26:00まで許可
  const timeRegex = /^([01]?[0-9]|2[0-6]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * 営業時間が跨日営業かどうかを判定
 */
export function isNextDayOperation(openTime: string, closeTime: string): boolean {
  const [openHour] = openTime.split(':').map(Number);
  const [closeHour] = closeTime.split(':').map(Number);
  
  // 終了時間が24時以降、または開始時間より小さい場合は跨日営業
  return closeHour >= 24 || closeHour < openHour;
}

/**
 * 26:00形式の時刻を標準的な表示に変換
 */
export function normalizeTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  
  if (hours >= 24) {
    return `翌${(hours - 24).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return time;
}