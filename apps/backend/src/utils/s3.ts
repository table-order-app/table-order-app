// AWS SDK の動的インポート（インストールされていない場合のエラー回避）
let S3Client: any = null
let PutObjectCommand: any = null
let DeleteObjectCommand: any = null

// AWS SDK のインポートを試行
async function loadAWSSDK() {
  try {
    const awsSDK = await import('@aws-sdk/client-s3')
    S3Client = awsSDK.S3Client
    PutObjectCommand = awsSDK.PutObjectCommand
    DeleteObjectCommand = awsSDK.DeleteObjectCommand
    return true
  } catch (error) {
    console.warn('AWS SDK not available, falling back to local storage')
    return false
  }
}

// S3クライアントの初期化
// S3クライアントを遅延初期化（環境変数が設定されている場合のみ）
let s3Client: S3Client | null = null

async function getS3Client() {
  if (!s3Client && isS3Enabled()) {
    const sdkLoaded = await loadAWSSDK()
    if (!sdkLoaded || !S3Client) {
      throw new Error('AWS SDK not available')
    }
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      } : undefined, // App RunnerのIAMロール使用時はundefined
    })
  }
  return s3Client!
}

/**
 * S3に画像ファイルをアップロード
 */
export async function uploadImageToS3(file: File, folder: string = 'menu'): Promise<string> {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is required')
  }

  // ファイル名の生成（タイムスタンプ + ランダム文字列 + 元のファイル名）
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomStr}.${fileExtension}`
  const key = `${folder}/${fileName}`

  try {
    const sdkLoaded = await loadAWSSDK()
    if (!sdkLoaded || !PutObjectCommand) {
      throw new Error('AWS SDK not available')
    }

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      ContentDisposition: 'inline',
      CacheControl: 'max-age=31536000', // 1年キャッシュ
    })

    await (await getS3Client()).send(command)

    // CloudFrontのURLを返す（フォールバックでS3直接URL）
    const baseUrl = process.env.CLOUDFRONT_URL || 
                   `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com`
    
    return `${baseUrl}/${key}`
  } catch (error) {
    console.error('S3 upload failed:', error)
    throw new Error('画像のアップロードに失敗しました')
  }
}

/**
 * S3から画像ファイルを削除
 */
export async function deleteImageFromS3(imageUrl: string): Promise<void> {
  if (!process.env.S3_BUCKET_NAME) {
    return // S3設定がない場合はスキップ
  }

  try {
    const sdkLoaded = await loadAWSSDK()
    if (!sdkLoaded || !DeleteObjectCommand) {
      return // AWS SDK not available, skip deletion
    }

    // URLからS3キーを抽出
    const url = new URL(imageUrl)
    const key = url.pathname.substring(1) // 先頭の/を除去

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    })

    await (await getS3Client()).send(command)
  } catch (error) {
    console.error('S3 delete failed:', error)
    // 削除失敗は非致命的なのでエラーを投げない
  }
}

/**
 * 現在の設定でS3が有効かどうかを確認
 */
export function isS3Enabled(): boolean {
  return !!(process.env.S3_BUCKET_NAME && process.env.AWS_REGION && process.env.NODE_ENV === 'production')
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