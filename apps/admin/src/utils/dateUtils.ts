/**
 * 日本時間（JST）基準の時刻表示ユーティリティ
 * 全ての時刻表示を統一し、日本のロケールで表示します
 */

import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日本時間で時刻を表示（HH:MM形式）
 * @param date Date オブジェクトまたは ISO 文字列
 * @returns HH:MM 形式の時刻文字列
 */
export function formatTimeJST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'HH:mm', { locale: ja })
}

/**
 * 日本時間で日付を表示（MM月dd日形式）
 * @param date Date オブジェクトまたは ISO 文字列
 * @returns MM月dd日 形式の日付文字列
 */
export function formatDateJST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MM月dd日', { locale: ja })
}

/**
 * 日本時間で完全な日時を表示（yyyy年MM月dd日 HH:mm形式）
 * @param date Date オブジェクトまたは ISO 文字列
 * @returns yyyy年MM月dd日 HH:mm 形式の日時文字列
 */
export function formatDateTimeJST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'yyyy年MM月dd日 HH:mm', { locale: ja })
}

/**
 * 日本時間で会計日付を表示（yyyy年MM月dd日形式）
 * @param date Date オブジェクトまたは ISO 文字列
 * @returns yyyy年MM月dd日 形式の日付文字列
 */
export function formatAccountingDateJST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'yyyy年MM月dd日', { locale: ja })
}

/**
 * 経過時間を分単位で計算（JST基準）
 * @param startDate 開始時刻
 * @returns 経過分数
 */
export function getElapsedMinutesJST(startDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const now = new Date() // NodeJSプロセスのタイムゾーンがJSTに設定済み
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
}

/**
 * 現在の日本時間を取得
 * @returns 現在の日本時間の Date オブジェクト
 */
export function getNowJST(): Date {
  return new Date() // NodeJSプロセスのタイムゾーンがJSTに設定済み
}