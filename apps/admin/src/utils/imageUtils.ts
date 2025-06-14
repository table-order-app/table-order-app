/**
 * 画像表示用ユーティリティ関数
 * S3移行対応済み
 */

interface ImageConfig {
  storage: 'local' | 's3';
  baseUrl: string;
  s3Config?: {
    bucketUrl?: string;
    cloudFrontUrl?: string;
  };
}

// 環境変数から設定を取得
function getImageConfig(): ImageConfig {
  const storageType = import.meta.env.VITE_STORAGE_TYPE || 'local';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  
  return {
    storage: storageType as 'local' | 's3',
    baseUrl: apiBaseUrl.replace('/api', ''),
    s3Config: {
      bucketUrl: import.meta.env.VITE_S3_BUCKET_URL,
      cloudFrontUrl: import.meta.env.VITE_CLOUDFRONT_URL,
    }
  };
}

/**
 * 画像パスを完全なURLに変換
 * ローカル保存とS3の両方に対応
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // 既にフルURLの場合はそのまま返す
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const config = getImageConfig();
  
  switch (config.storage) {
    case 's3':
      // S3使用時: CloudFront URL > S3バケットURL > フォールバック
      const s3BaseUrl = config.s3Config?.cloudFrontUrl || 
                        config.s3Config?.bucketUrl || 
                        config.baseUrl;
      return `${s3BaseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
      
    case 'local':
    default:
      // ローカル保存時: APIベースURLを使用
      return `${config.baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  }
}

/**
 * デフォルト画像パスを取得
 */
export function getDefaultImageUrl(): string {
  return '/assets/images/default-menu.png';
}

/**
 * 画像URL取得（フォールバック付き）
 */
export function getImageUrlWithFallback(imagePath: string | null | undefined): string {
  return getImageUrl(imagePath) || getDefaultImageUrl();
}

/**
 * 環境情報取得（デバッグ用）
 */
export function getImageEnvironmentInfo() {
  const config = getImageConfig();
  return {
    storage: config.storage,
    baseUrl: config.baseUrl,
    s3BucketUrl: config.s3Config?.bucketUrl,
    cloudFrontUrl: config.s3Config?.cloudFrontUrl,
  };
}