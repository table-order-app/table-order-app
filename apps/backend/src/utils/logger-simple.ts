/**
 * シンプルなロガー実装（winston依存なし）
 * winston がインストールされていない場合のフォールバック
 */

// ログレベルの定義
type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  meta?: Record<string, any>
}

class SimpleLogger {
  private logLevel: LogLevel

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 
                   (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    }
    return levels[level] <= levels[this.logLevel]
  }

  private formatLog(level: LogLevel, message: string, meta?: Record<string, any>): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta })
    }

    if (process.env.NODE_ENV === 'production') {
      // 本番環境: JSON形式
      return JSON.stringify(entry)
    } else {
      // 開発環境: 読みやすい形式
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
      return `${entry.timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`
    }
  }

  error(message: string, meta?: Record<string, any>) {
    if (this.shouldLog('error')) {
      console.error(this.formatLog('error', message, meta))
    }
  }

  warn(message: string, meta?: Record<string, any>) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, meta))
    }
  }

  info(message: string, meta?: Record<string, any>) {
    if (this.shouldLog('info')) {
      console.log(this.formatLog('info', message, meta))
    }
  }

  debug(message: string, meta?: Record<string, any>) {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('debug', message, meta))
    }
  }
}

// シングルトンインスタンス
export const logger = new SimpleLogger()

// ヘルパー関数
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

export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(message, context)
}

export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug(message, context)
}

// Express用のミドルウェア関数（簡易版）
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