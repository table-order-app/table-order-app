/**
 * 現在の設定でS3が有効かどうかを確認
 * AWS機能は削除されたため常にfalseを返す
 */
export function isS3Enabled(): boolean {
  return false
}

/**
 * ローカル画像ファイルを保存（開発環境用フォールバック）
 */
export async function saveImageLocally(file: File, folder: string = 'menu'): Promise<string> {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  // アップロードディレクトリの確保
  const uploadDir = `./public/uploads/${folder}`
  await fs.mkdir(uploadDir, { recursive: true })
  
  // ファイル名の生成
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomStr}.${fileExtension}`
  const filePath = path.join(uploadDir, fileName)
  
  // ファイルの保存
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fs.writeFile(filePath, buffer)
  
  // 公開URLパスを返す
  return `/uploads/${folder}/${fileName}`
}

/**
 * 環境に応じて画像を保存
 */
export async function saveImage(file: File, folder: string = 'menu'): Promise<string> {
  if (isS3Enabled()) {
    return uploadImageToS3(file, folder)
  } else {
    return saveImageLocally(file, folder)
  }
}