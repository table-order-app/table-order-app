/**
 * Cloudflare R2 ストレージユーティリティ
 * AWS S3互換APIを使用してCloudflare R2にファイルをアップロード/管理
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2設定の型定義
interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicDomain?: string // Custom domain for public access
}

// R2クライアントのシングルトンインスタンス
let r2Client: S3Client | null = null
let r2Config: R2Config | null = null

/**
 * R2設定を初期化
 */
function initializeR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME
  const publicDomain = process.env.R2_PUBLIC_DOMAIN

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('R2 credentials are not properly configured. Check environment variables.')
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain
  }
}

/**
 * R2クライアントを取得（遅延初期化）
 */
function getR2Client(): S3Client {
  if (!r2Client || !r2Config) {
    r2Config = initializeR2Config()
    
    r2Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    })
  }
  
  return r2Client
}

/**
 * R2が有効かどうかを確認
 */
export function isR2Enabled(): boolean {
  try {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucketName = process.env.R2_BUCKET_NAME
    
    return !!(accountId && accessKeyId && secretAccessKey && bucketName)
  } catch {
    return false
  }
}

/**
 * ファイルをR2にアップロード
 */
export async function uploadImageToR2(file: File, folder: string = 'menu'): Promise<string> {
  const client = getR2Client()
  const config = r2Config!
  
  // ファイル名の生成
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${timestamp}-${randomStr}.${fileExtension}`
  const key = `${folder}/${fileName}`
  
  // ファイルデータをバッファに変換
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Content-Typeを推定
  const contentType = getContentType(fileExtension)
  
  try {
    // R2にアップロード
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // キャッシュ設定
      CacheControl: 'public, max-age=31536000', // 1年
      // メタデータ
      Metadata: {
        originalFileName: file.name,
        uploadedAt: new Date().toISOString(),
        folder: folder
      }
    })
    
    await client.send(command)
    
    // 公開URLを生成
    return generatePublicUrl(key, config)
  } catch (error) {
    console.error('Failed to upload to R2:', error)
    throw new Error(`R2アップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * R2からファイルを削除
 */
export async function deleteImageFromR2(imagePath: string): Promise<void> {
  if (!imagePath || !imagePath.includes('/')) {
    return // 無効なパスの場合はスキップ
  }
  
  const client = getR2Client()
  const config = r2Config!
  
  // URLからキーを抽出
  const key = extractKeyFromPath(imagePath)
  if (!key) {
    console.warn('Could not extract key from image path:', imagePath)
    return
  }
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key
    })
    
    await client.send(command)
    console.log('Successfully deleted from R2:', key)
  } catch (error) {
    console.error('Failed to delete from R2:', error)
    throw new Error(`R2削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 署名付きURLを生成（一時的なアクセス用）
 */
export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getR2Client()
  const config = r2Config!
  
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key
  })
  
  return await getSignedUrl(client, command, { expiresIn })
}

/**
 * 公開URLを生成
 */
function generatePublicUrl(key: string, config: R2Config): string {
  if (config.publicDomain) {
    // カスタムドメインが設定されている場合
    return `https://${config.publicDomain}/${key}`
  } else {
    // デフォルトのR2 public URL
    return `https://pub-${config.accountId}.r2.dev/${key}`
  }
}

/**
 * ファイル拡張子からContent-Typeを推定
 */
function getContentType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon'
  }
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

/**
 * 画像パスからR2キーを抽出
 */
function extractKeyFromPath(imagePath: string): string | null {
  // 既存のローカルパスの場合 (/uploads/menu/filename.jpg)
  if (imagePath.startsWith('/uploads/')) {
    return imagePath.substring(9) // '/uploads/' を除去
  }
  
  // R2の公開URLの場合
  if (imagePath.includes('/menu/') || imagePath.includes('/category/')) {
    const parts = imagePath.split('/')
    const menuIndex = parts.findIndex(part => part === 'menu' || part === 'category')
    if (menuIndex >= 0 && menuIndex < parts.length - 1) {
      return parts.slice(menuIndex).join('/')
    }
  }
  
  // その他の場合はそのまま返す
  return imagePath.startsWith('/') ? imagePath.substring(1) : imagePath
}

/**
 * ローカル画像ファイルを保存（フォールバック用）
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
  if (isR2Enabled()) {
    return uploadImageToR2(file, folder)
  } else {
    return saveImageLocally(file, folder)
  }
}

/**
 * 古い画像を削除（環境に応じて）
 */
export async function deleteOldImage(imagePath: string | null): Promise<void> {
  if (!imagePath) return
  
  try {
    if (isR2Enabled()) {
      await deleteImageFromR2(imagePath)
    } else {
      // ローカルファイルの削除は開発環境のため実行しない
      console.log('Local image deletion skipped (development mode)', { imagePath })
    }
  } catch (error) {
    console.error('Failed to delete old image:', error)
  }
}