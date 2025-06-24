import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { logger as structuredLogger, logError, logInfo } from './utils/logger-simple'
import { serveStatic } from '@hono/node-server/serve-static'
import { menuRoutes } from './routes/menu'
import { orderRoutes } from './routes/order'
import { tableRoutes } from './routes/table'
import { staffRoutes } from './routes/staff'
import { settingRoutes } from './routes/setting'
import { storeRoutes } from './routes/store'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { staffAuthRoutes } from './routes/staffAuth'
import { accountingRoutes } from './routes/accounting'

const app = new Hono()

// CORS設定 - 環境別の堅牢な設定
const isProduction = process.env.NODE_ENV === 'production'

// 開発環境用のデフォルトオリジン（フォールバック）
const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3001', // table app
  'http://localhost:3002', // admin app  
  'http://localhost:3003', // kitchen app
  'http://localhost:3004', // staff app
  'http://localhost:5173', // Legacy Vite ports
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
]

// 環境変数からオリジンを取得
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : (isProduction ? [] : DEFAULT_DEV_ORIGINS)

console.log('🔧 CORS Configuration:')
console.log('  Environment:', process.env.NODE_ENV || 'development')
console.log('  Production mode:', isProduction)
console.log('  ALLOWED_ORIGINS env:', process.env.ALLOWED_ORIGINS || 'not set')
console.log('  Final allowed origins:', allowedOrigins)

// 本番環境で環境変数が設定されていない場合の警告
if (isProduction && !process.env.ALLOWED_ORIGINS) {
  console.error('❌ SECURITY WARNING: ALLOWED_ORIGINS not set in production!')
  console.error('   This will block all cross-origin requests.')
}

// Middleware
app.use('*', logger())

// リクエストサイズ制限を緩和（ファイルアップロード用）
app.use('*', async (c, next) => {
  // 大きなリクエストボディを許可
  if (c.req.header('content-type')?.includes('multipart/form-data')) {
    // マルチパートデータ（ファイルアップロード）用の特別処理
    return await next()
  }
  await next()
})

// CORSミドルウェア
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin')
  
  // オリジンチェック
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    c.header('Access-Control-Allow-Origin', origin)
  }
  
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, x-store-code, x-table-number')
  
  if (c.req.method === 'OPTIONS') {
    return c.text('OK', 204)
  }
  
  await next()
})

app.use('*', prettyJSON())

// カスタムエラーハンドラー
app.onError((err, c) => {
  logError('Application error occurred', err, {
    url: c.req.url,
    method: c.req.method,
    userAgent: c.req.header('User-Agent')
  })
  
  // Zodバリデーションエラーの場合
  if (err.name === 'ZodError') {
    const zodError = err as any
    const firstError = zodError.issues?.[0]
    const message = firstError?.message || 'バリデーションエラーが発生しました'
    return c.json({ success: false, error: message }, 400)
  }
  
  return c.json({ success: false, error: 'サーバーエラーが発生しました' }, 500)
})

// 画像配信を有効化（簡易デプロイ用）
app.use('/uploads/*', serveStatic({ root: './public' }))
logInfo('Static file serving enabled')

// 開発環境でのCORSテスト用エンドポイント（本番では無効）
if (process.env.NODE_ENV !== 'production') {
  app.get('/cors-test', (c) => {
    return c.json({ 
      message: 'CORS is working',
      origin: c.req.header('Origin'),
      timestamp: new Date().toISOString()
    })
  })
}

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/staff-auth', staffAuthRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/store', storeRoutes)
app.route('/api/menu', menuRoutes)
app.route('/api/order', orderRoutes)
app.route('/api/table', tableRoutes)
app.route('/api/staff', staffRoutes)
app.route('/api/setting', settingRoutes)
app.route('/api/accounting', accountingRoutes)

// Health check endpoints
app.get('/', (c) => c.json({ status: 'ok', message: 'Accorto API Server' }))

app.get('/health', async (c) => {
  try {
    // データベース接続確認
    const { db } = await import('./db')
    const { stores } = await import('./db/schema')
    await db.select().from(stores).limit(1)
    
    return c.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        s3: process.env.S3_BUCKET_NAME ? 'configured' : 'local'
      }
    })
  } catch (error) {
    logError('Health check failed', error)
    return c.json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, 503)
  }
})

app.get('/ready', (c) => {
  // Readiness probe for App Runner
  return c.json({ status: 'ready', timestamp: new Date().toISOString() })
})

// 環境変数バリデーション
function validateEnvironment() {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const requiredEnvVars = ['DATABASE_URL']
  
  // 本番環境でのみ厳密なバリデーション
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    if (isDevelopment) {
      console.warn('⚠️  Missing environment variables in development:', missingVars)
      // 開発環境ではデフォルト値を設定
      if (!process.env.DATABASE_URL) {
        console.warn('DATABASE_URL not set, using default local database')
        process.env.DATABASE_URL = 'postgres://itouharuki@localhost:5432/accorto'
      }
    } else {
      logError('Missing required environment variables', new Error('Environment validation failed'), {
        missingVariables: missingVars
      })
      process.exit(1)
    }
  }
  
  logInfo('Environment validation passed', {
    nodeEnv: process.env.NODE_ENV || 'development',
    s3Enabled: !!(process.env.S3_BUCKET_NAME && process.env.AWS_REGION),
    port: process.env.PORT || (isDevelopment ? 3000 : 8080),
    development: isDevelopment
  })
}

// Start server
validateEnvironment()

const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 3000)
logInfo('Starting Accorto API Server', { 
  port, 
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0'
})

serve({
  fetch: app.fetch,
  port: Number(port),
  // Node.jsサーバー用の設定
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
})
