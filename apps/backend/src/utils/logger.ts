import winston from 'winston'

// CloudWatch Logs用の構造化ログフォーマット
const cloudWatchFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// 開発環境用の読みやすいフォーマット
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// ログレベルの設定
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

// Winstonロガーの作成
export const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? cloudWatchFormat : developmentFormat,
  defaultMeta: {
    service: 'accorto-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
})

// 開発環境では詳細なログを出力
if (process.env.NODE_ENV !== 'production') {
  // ログディレクトリを作成
  try {
    const fs = require('fs')
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true })
    }
    
    logger.add(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json()
    }))
    
    logger.add(new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json()
    }))
  } catch (error) {
    console.warn('Could not create log files:', error.message)
  }
}

// Express用のミドルウェア関数を追加
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()
    
    res.on('finish', () => {
      const duration = Date.now() - startTime
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      })
    })
    
    next()
  }
}

// エラーログ用のヘルパー関数
export function logError(message: string, error: any, context?: Record<string, any>) {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    ...context
  })
}

// 成功ログ用のヘルパー関数
export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(message, context)
}

// デバッグログ用のヘルパー関数
export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug(message, context)
}