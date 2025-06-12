/**
 * 店舗コード生成ユーティリティ
 */

/**
 * 8文字の英数字店舗コードを生成
 * 形式: A5X8K2M7 (大文字英字3文字 + 数字1文字 + 大文字英字1文字 + 数字1文字 + 大文字英字1文字 + 数字1文字)
 */
export function generateStoreCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // 紛らわしい文字（I, O）を除外
  const numbers = '23456789' // 紛らわしい数字（0, 1）を除外
  
  let code = ''
  
  // パターン: LLLNLNLN (L=Letter, N=Number)
  code += getRandomChar(letters) // 1文字目: 英字
  code += getRandomChar(letters) // 2文字目: 英字  
  code += getRandomChar(letters) // 3文字目: 英字
  code += getRandomChar(numbers) // 4文字目: 数字
  code += getRandomChar(letters) // 5文字目: 英字
  code += getRandomChar(numbers) // 6文字目: 数字
  code += getRandomChar(letters) // 7文字目: 英字
  code += getRandomChar(numbers) // 8文字目: 数字
  
  return code
}

/**
 * 文字列から1文字をランダムに選択
 */
function getRandomChar(chars: string): string {
  return chars.charAt(Math.floor(Math.random() * chars.length))
}

/**
 * 店舗コードの形式チェック
 */
export function isValidStoreCode(code: string): boolean {
  // 8文字の英数字（大文字）
  return /^[A-Z0-9]{8}$/.test(code)
}

/**
 * 店舗コードの表示用フォーマット
 * 例: A5X8K2M7 → A5X8-K2M7
 */
export function formatStoreCode(code: string): string {
  if (code.length === 8) {
    return `${code.slice(0, 4)}-${code.slice(4)}`
  }
  return code
}