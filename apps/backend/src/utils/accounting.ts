/**
 * 会計関連のユーティリティ関数
 * 全ての時刻処理は日本時間（JST, UTC+9）基準で行われます
 */

import { BusinessHours } from '../types/business-hours'

/**
 * 現在の日本時間（JST）を取得
 * @returns 日本時間のDateオブジェクト
 */
export function getJSTDate(): Date {
  // NodeJSプロセスのタイムゾーンがAsia/Tokyoに設定されているため、
  // new Date()は自動的にJSTを返します
  return new Date()
}

/**
 * データベース保存用のJSTタイムスタンプを生成
 * @returns データベースに保存するためのJST Dateオブジェクト
 */
export function createJSTTimestamp(): Date {
  // 明示的にJST（UTC+9）のDateオブジェクトを作成
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000 // 9時間をミリ秒で
  const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
  return new Date(utc + jstOffset)
}

/**
 * 日本時間基準で日の切り替え時間を考慮した会計日を取得
 * @param date 対象の日時（JST）
 * @param dayClosingTime 日の切り替え時間 (HH:MM:SS形式, JST)
 * @returns 会計日 (YYYY-MM-DD形式)
 */
export function getAccountingDate(date: Date, dayClosingTime: string): string {
  const [hours, minutes, seconds] = dayClosingTime.split(':').map(Number)
  
  // 日の切り替え時間をDateオブジェクトに変換
  const closingTime = new Date(date)
  closingTime.setHours(hours, minutes, seconds, 0)
  
  // 指定時間より前の場合は前日扱い
  if (date < closingTime) {
    const accountingDate = new Date(date)
    accountingDate.setDate(accountingDate.getDate() - 1)
    return accountingDate.toISOString().split('T')[0]
  }
  
  return date.toISOString().split('T')[0]
}

/**
 * 会計日の期間を取得
 * @param accountingDate 会計日 (YYYY-MM-DD形式)
 * @param dayClosingTime 日の切り替え時間 (HH:MM:SS形式)
 * @returns 期間の開始・終了日時
 */
export function getAccountingPeriod(accountingDate: string, dayClosingTime: string): {
  start: Date
  end: Date
} {
  const [hours, minutes, seconds] = dayClosingTime.split(':').map(Number)
  
  // 期間開始：会計日の切り替え時間
  const start = new Date(`${accountingDate}T${dayClosingTime}`)
  
  // 期間終了：翌日の切り替え時間
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  
  return { start, end }
}

/**
 * 現在の会計日を取得（JST基準）
 * @param dayClosingTime 日の切り替え時間 (HH:MM:SS形式, JST)
 * @returns 現在の会計日 (YYYY-MM-DD形式)
 */
export function getCurrentAccountingDate(dayClosingTime: string = '05:00:00'): string {
  return getAccountingDate(getJSTDate(), dayClosingTime)
}

/**
 * 日本時間で現在時刻の文字列を取得
 * @param format 'date' | 'time' | 'datetime'
 * @returns フォーマットされた時刻文字列
 */
export function getJSTString(format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const now = getJSTDate()
  
  switch (format) {
    case 'date':
      return now.toISOString().split('T')[0] // YYYY-MM-DD
    case 'time':
      return now.toTimeString().split(' ')[0] // HH:MM:SS
    case 'datetime':
      return now.toISOString().replace('T', ' ').substring(0, 19) // YYYY-MM-DD HH:MM:SS
    default:
      return now.toISOString()
  }
}

/**
 * 税込み金額を計算
 * @param subtotal 税抜き金額
 * @param taxRate 税率 (例: 0.10 = 10%)
 * @returns 税額と税込み合計
 */
export function calculateTax(subtotal: number, taxRate: number): {
  taxAmount: number
  totalAmount: number
} {
  const taxAmount = Math.floor(subtotal * taxRate)
  const totalAmount = subtotal + taxAmount
  
  return { taxAmount, totalAmount }
}

/**
 * 注文アイテムの金額を計算
 * @param basePrice 基本価格
 * @param optionsPrice オプション価格の合計
 * @param toppingsPrice トッピング価格の合計
 * @param quantity 数量
 * @returns 単価と合計価格
 */
export function calculateItemPrice(
  basePrice: number,
  optionsPrice: number,
  toppingsPrice: number,
  quantity: number
): {
  unitPrice: number
  totalPrice: number
} {
  const unitPrice = basePrice + optionsPrice + toppingsPrice
  const totalPrice = unitPrice * quantity
  
  return { unitPrice, totalPrice }
}

/**
 * 会計日のリストを生成
 * @param startDate 開始日 (YYYY-MM-DD形式)
 * @param endDate 終了日 (YYYY-MM-DD形式)
 * @returns 会計日の配列
 */
export function generateAccountingDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(current.toISOString().split('T')[0])
  }
  
  return dates
}

/**
 * 価格をセント単位からJPY単位に変換
 * @param centAmount セント単位の金額
 * @returns JPY単位の金額
 */
export function centToJpy(centAmount: number): number {
  return centAmount / 100
}

/**
 * JPY単位の金額をセント単位に変換
 * @param jpyAmount JPY単位の金額
 * @returns セント単位の金額
 */
export function jpyToCent(jpyAmount: number): number {
  return Math.round(jpyAmount * 100)
}

/**
 * 営業時間ベースの会計日を取得
 * @param date 対象の日時（JST）
 * @param businessHours 営業時間設定
 * @returns 会計日 (YYYY-MM-DD形式)
 * 
 * 例: 営業時間 17:00-26:00の場合
 * - 6/12 17:00 ～ 6/13 17:00 → 6/12の会計日
 * - 6/13 0:13の注文 → 6/12の売上
 */
export function getBusinessAccountingDate(date: Date, businessHours: BusinessHours): string {
  const [openHour, openMin] = businessHours.openTime.split(':').map(Number)
  
  // 営業開始時間をDateオブジェクトに変換
  const businessStart = new Date(date)
  businessStart.setHours(openHour, openMin, 0, 0)
  
  // 営業開始時間より前の場合は前日扱い
  if (date < businessStart) {
    const accountingDate = new Date(date)
    accountingDate.setDate(accountingDate.getDate() - 1)
    return accountingDate.toISOString().split('T')[0]
  }
  
  return date.toISOString().split('T')[0]
}

/**
 * 営業時間ベースの会計期間を取得
 * @param accountingDate 会計日 (YYYY-MM-DD形式)
 * @param businessHours 営業時間設定
 * @returns 期間の開始・終了日時
 * 
 * 例: 6/12の会計日、営業時間 17:00-26:00の場合
 * - 開始: 6/12 17:00:00
 * - 終了: 6/13 17:00:00
 */
export function getBusinessAccountingPeriod(
  accountingDate: string, 
  businessHours: BusinessHours
): {
  start: Date
  end: Date
} {
  const [openHour, openMin] = businessHours.openTime.split(':').map(Number)
  
  // 期間開始：会計日の営業開始時間
  const start = new Date(`${accountingDate}T${businessHours.openTime}:00`)
  
  // 期間終了：翌日の営業開始時間
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  
  return { start, end }
}

/**
 * 現在の営業ベース会計日を取得（JST基準）
 * @param businessHours 営業時間設定
 * @returns 現在の会計日 (YYYY-MM-DD形式)
 */
export function getCurrentBusinessAccountingDate(businessHours: BusinessHours): string {
  return getBusinessAccountingDate(getJSTDate(), businessHours)
}

/**
 * 指定時刻が営業時間内かどうかを判定
 * @param time 判定する時刻（JST）
 * @param businessHours 営業時間設定
 * @returns 営業時間内の場合 true
 */
export function isWithinBusinessHours(time: Date, businessHours: BusinessHours): boolean {
  const [openHour, openMin] = businessHours.openTime.split(':').map(Number)
  const [closeHour, closeMin] = businessHours.closeTime.split(':').map(Number)
  
  // 営業開始時間
  const businessStart = new Date(time)
  businessStart.setHours(openHour, openMin, 0, 0)
  
  // 営業終了時間
  let businessEnd = new Date(time)
  if (businessHours.isNextDay) {
    // 跨日営業の場合は翌日に設定
    businessEnd.setDate(businessEnd.getDate() + 1)
  }
  
  // 26:00表記の場合は時間を調整（26:00 → 翌日02:00）
  const actualCloseHour = closeHour >= 24 ? closeHour - 24 : closeHour
  businessEnd.setHours(actualCloseHour, closeMin, 0, 0)
  
  return time >= businessStart && time <= businessEnd
}

/**
 * 注文時刻から営業日を特定
 * @param orderTime 注文時刻（JST）
 * @param businessHours 営業時間設定
 * @returns 営業日の情報
 * 
 * 例: 6/13 0:13の注文、営業時間17:00-26:00
 * → { accountingDate: "2025-06-12", businessDay: "6/12", isCurrentBusiness: true }
 */
export function identifyBusinessDay(orderTime: Date, businessHours: BusinessHours): {
  accountingDate: string
  businessDay: string
  isCurrentBusiness: boolean
  period: { start: Date; end: Date }
} {
  const accountingDate = getBusinessAccountingDate(orderTime, businessHours)
  const period = getBusinessAccountingPeriod(accountingDate, businessHours)
  const isCurrentBusiness = isWithinBusinessHours(orderTime, businessHours)
  
  // 営業日の表示用文字列（6/12形式）
  const [year, month, day] = accountingDate.split('-')
  const businessDay = `${month}/${day}`
  
  return {
    accountingDate,
    businessDay,
    isCurrentBusiness,
    period
  }
}