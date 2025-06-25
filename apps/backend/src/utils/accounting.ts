/**
 * 会計関連のユーティリティ関数
 * 全ての時刻処理は日本時間（JST, UTC+9）基準で行われます
 */

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
  return getJSTDate()
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