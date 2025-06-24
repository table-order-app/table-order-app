import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { db } from '../db'
import { stores } from '../db/schema'
import { eq } from 'drizzle-orm'
import { JWT_SECRET } from '../config/jwt'
import { logError } from '../utils/logger-simple'

export interface AuthContext {
  storeId: number
  store: {
    id: number
    name: string
    email: string
    ownerName: string
    active: boolean
  }
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

/**
 * JWT認証ミドルウェア
 * Authorizationヘッダーからトークンを取得し、検証して店舗情報をコンテキストに設定
 */
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verify(token, JWT_SECRET)
    
    // 店舗情報を取得
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, payload.storeId as number),
    })
    
    if (!store || !store.active) {
      return c.json({ success: false, error: '無効な店舗アカウントです' }, 401)
    }
    
    // 認証情報をコンテキストに設定
    c.set('auth', {
      storeId: store.id,
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        ownerName: store.ownerName,
        active: store.active,
      }
    })
    
    await next()
    
  } catch (error) {
    logError('Auth middleware error:', error)
    return c.json({ success: false, error: '認証に失敗しました' }, 401)
  }
}

/**
 * テーブルアプリ用認証ミドルウェア
 * X-Store-CodeとX-Table-Numberヘッダーから店舗情報を取得
 */
export const tableAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const storeCode = c.req.header('X-Store-Code')
    const tableNumber = c.req.header('X-Table-Number')
    
    if (!storeCode || !tableNumber) {
      return c.json({ success: false, error: '店舗コードとテーブル番号が必要です' }, 401)
    }
    
    // 店舗コードから店舗情報を取得
    const store = await db.query.stores.findFirst({
      where: eq(stores.storeCode, storeCode),
    })
    
    if (!store || !store.active) {
      return c.json({ success: false, error: '無効な店舗コードです' }, 401)
    }
    
    // 認証情報をコンテキストに設定
    c.set('auth', {
      storeId: store.id,
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        ownerName: store.ownerName,
        active: store.active,
      }
    })
    
    await next()
    
  } catch (error) {
    logError('Table auth middleware error:', error)
    return c.json({ success: false, error: '認証に失敗しました' }, 401)
  }
}

/**
 * 統合認証ミドルウェア
 * JWT認証またはテーブル認証のいずれかをサポート
 */
export const flexibleAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    const storeCode = c.req.header('X-Store-Code')
    
    // JWT認証を試行
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = await verify(token, JWT_SECRET)
      
      // 店舗情報を取得
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, payload.storeId as number),
      })
      
      if (store && store.active) {
        c.set('auth', {
          storeId: store.id,
          store: {
            id: store.id,
            name: store.name,
            email: store.email,
            ownerName: store.ownerName,
            active: store.active,
          }
        })
        await next()
        return
      }
    }
    
    // 店舗コード認証を試行（テーブル番号はオプショナル）
    if (storeCode) {
      const store = await db.query.stores.findFirst({
        where: eq(stores.storeCode, storeCode),
      })
      
      if (store && store.active) {
        c.set('auth', {
          storeId: store.id,
          store: {
            id: store.id,
            name: store.name,
            email: store.email,
            ownerName: store.ownerName,
            active: store.active,
          }
        })
        await next()
        return
      }
    }
    
    return c.json({ success: false, error: '認証が必要です' }, 401)
    
  } catch (error) {
    logError('Flexible auth middleware error:', error)
    return c.json({ success: false, error: '認証に失敗しました' }, 401)
  }
}

/**
 * オプショナル認証ミドルウェア
 * 認証情報があれば設定するが、なくてもエラーにしない
 */
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = await verify(token, JWT_SECRET)
      
      // 店舗情報を取得
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, payload.storeId as number),
      })
      
      if (store && store.active) {
        // 認証情報をコンテキストに設定
        c.set('auth', {
          storeId: store.id,
          store: {
            id: store.id,
            name: store.name,
            email: store.email,
            ownerName: store.ownerName,
            active: store.active,
          }
        })
      }
    }
    
    await next()
    
  } catch (error) {
    logError('Optional auth middleware error:', error)
    // オプショナル認証なのでエラーでも続行
    await next()
  }
}