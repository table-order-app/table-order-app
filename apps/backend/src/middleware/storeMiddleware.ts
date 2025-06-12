import { Context, Next } from 'hono'
import { db } from '../db'
import { stores } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * 店舗ID必須化ミドルウェア
 * リクエストに店舗IDが含まれていることを確認し、contextに設定する
 */
export const requireStoreId = async (c: Context, next: Next) => {
  // 店舗IDを複数のソースから取得を試行
  const storeId = 
    c.req.query('storeId') ||           // クエリパラメータ
    c.req.header('X-Store-ID') ||       // ヘッダー
    c.req.header('Store-ID') ||         // 代替ヘッダー
    c.get('storeId')                    // 既にcontextに設定済み

  if (!storeId) {
    return c.json({
      success: false,
      error: '店舗IDが必要です。storeIdクエリパラメータまたはX-Store-IDヘッダーで指定してください。'
    }, 400)
  }

  const numericStoreId = Number(storeId)
  
  if (isNaN(numericStoreId) || numericStoreId <= 0) {
    return c.json({
      success: false,
      error: '有効な店舗IDを指定してください。'
    }, 400)
  }

  // 店舗の存在確認
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, numericStoreId)
    })

    if (!store) {
      return c.json({
        success: false,
        error: `店舗ID ${numericStoreId} は存在しません。`
      }, 404)
    }

    if (!store.active) {
      return c.json({
        success: false,
        error: `店舗ID ${numericStoreId} は現在利用できません。`
      }, 403)
    }

    // contextに店舗情報を設定
    c.set('storeId', numericStoreId)
    c.set('store', store)
    
    await next()
  } catch (error) {
    console.error('Store validation error:', error)
    return c.json({
      success: false,
      error: '店舗情報の確認中にエラーが発生しました。'
    }, 500)
  }
}

/**
 * 店舗IDを自動取得するミドルウェア（下位互換性のため）
 * 店舗IDが指定されていない場合、最初の有効な店舗を使用
 * 本番環境では非推奨だが、開発・移行期間での利用を想定
 */
export const autoStoreId = async (c: Context, next: Next) => {
  // 既に店舗IDが設定されている場合はスキップ
  if (c.get('storeId')) {
    await next()
    return
  }

  const storeId = 
    c.req.query('storeId') ||
    c.req.header('X-Store-ID') ||
    c.req.header('Store-ID')

  if (storeId) {
    // 店舗IDが指定されている場合はrequireStoreIdと同じ処理
    c.set('storeId', Number(storeId))
    await requireStoreId(c, next)
    return
  }

  // 店舗IDが未指定の場合、最初の有効な店舗を取得
  try {
    const firstStore = await db.query.stores.findFirst({
      where: eq(stores.active, true),
      orderBy: (stores, { asc }) => [asc(stores.id)]
    })

    if (!firstStore) {
      return c.json({
        success: false,
        error: '有効な店舗が見つかりません。'
      }, 500)
    }

    c.set('storeId', firstStore.id)
    c.set('store', firstStore)
    
    // 開発環境でのみ警告ログを出力
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  店舗IDが未指定のため、店舗ID ${firstStore.id} (${firstStore.name}) を自動選択しました。本番環境では店舗IDを明示的に指定してください。`)
    }
    
    await next()
  } catch (error) {
    console.error('Auto store selection error:', error)
    return c.json({
      success: false,
      error: '店舗情報の取得中にエラーが発生しました。'
    }, 500)
  }
}

/**
 * 店舗IDをcontextから取得するヘルパー関数
 */
export const getStoreId = (c: Context): number => {
  const storeId = c.get('storeId')
  if (!storeId) {
    throw new Error('Store ID not found in context. Use requireStoreId or autoStoreId middleware.')
  }
  return storeId
}

/**
 * 店舗情報をcontextから取得するヘルパー関数
 */
export const getStore = (c: Context) => {
  const store = c.get('store')
  if (!store) {
    throw new Error('Store not found in context. Use requireStoreId or autoStoreId middleware.')
  }
  return store
}