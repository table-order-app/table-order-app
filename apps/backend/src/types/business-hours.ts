/**
 * 営業時間の型定義
 * 跨日営業に対応し、会計日計算と統合される
 */

export interface BusinessHours {
  /** 営業開始時間 (HH:MM形式) */
  openTime: string;
  
  /** 営業終了時間 (HH:MM形式、26:00など跨日表記も可能) */
  closeTime: string;
  
  /** 翌日跨ぎ営業かどうか */
  isNextDay: boolean;
  
  /** タイムゾーン */
  timezone: string;
  
  /** 会計日の開始時間（営業開始時間と同じ） */
  accountingDayStart: string;
}

export interface BusinessHoursInput {
  openTime: string;
  closeTime: string;
}

/**
 * 26:00形式の時刻を24時間形式に変換
 * @param time "26:00" → "02:00"
 */
export function normalizeTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  
  if (hours >= 24) {
    return `${(hours - 24).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return time;
}

/**
 * 営業時間が跨日営業かどうかを判定
 * @param openTime 営業開始時間
 * @param closeTime 営業終了時間
 */
export function isNextDayOperation(openTime: string, closeTime: string): boolean {
  const [openHour] = openTime.split(':').map(Number);
  const [closeHour] = closeTime.split(':').map(Number);
  
  // 終了時間が24時以降、または開始時間より小さい場合は跨日営業
  return closeHour >= 24 || closeHour < openHour;
}

/**
 * 営業時間入力から完全な営業時間オブジェクトを作成
 * @param input 営業時間入力
 */
export function createBusinessHours(input: BusinessHoursInput): BusinessHours {
  const isNextDay = isNextDayOperation(input.openTime, input.closeTime);
  
  return {
    openTime: input.openTime,
    closeTime: input.closeTime,
    isNextDay,
    timezone: 'Asia/Tokyo',
    accountingDayStart: input.openTime, // 営業開始時間 = 会計日開始時間
  };
}

/**
 * 営業時間表示用の文字列を作成
 * @param hours 営業時間オブジェクト
 */
export function formatBusinessHours(hours: BusinessHours): string {
  if (hours.isNextDay) {
    return `${hours.openTime} 〜 ${hours.closeTime}（翌日）`;
  }
  return `${hours.openTime} 〜 ${hours.closeTime}`;
}

/**
 * 指定時刻が営業時間内かどうかを判定
 * @param time 判定する時刻
 * @param hours 営業時間
 * @param date 基準日
 */
export function isWithinBusinessHours(
  time: Date, 
  hours: BusinessHours, 
  date: Date = new Date()
): boolean {
  const [openHour, openMin] = hours.openTime.split(':').map(Number);
  const [closeHour, closeMin] = hours.closeTime.split(':').map(Number);
  
  const businessStart = new Date(date);
  businessStart.setHours(openHour, openMin, 0, 0);
  
  let businessEnd = new Date(date);
  if (hours.isNextDay) {
    businessEnd.setDate(businessEnd.getDate() + 1);
  }
  
  // 26:00表記の場合は時間を調整
  const actualCloseHour = closeHour >= 24 ? closeHour - 24 : closeHour;
  businessEnd.setHours(actualCloseHour, closeMin, 0, 0);
  
  return time >= businessStart && time <= businessEnd;
}