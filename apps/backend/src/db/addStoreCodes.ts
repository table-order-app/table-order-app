/**
 * 既存店舗に店舗コードを追加するスクリプト
 */
import 'dotenv/config'
import { db } from './index'
import { stores } from './schema'
import { eq } from 'drizzle-orm'
import { generateStoreCode } from '../utils/storeCode'
import { logError } from '../utils/logger-simple'

async function addStoreCodes() {
  // console.log('既存店舗に店舗コードを追加中...')
  
  try {
    // 店舗コードが未設定の店舗を取得
    const storesWithoutCode = await db.query.stores.findMany({
      where: eq(stores.storeCode, null)
    })
    
    // console.log(`店舗コード未設定の店舗: ${storesWithoutCode.length}件`)
    
    for (const store of storesWithoutCode) {
      // 店舗コード生成（重複チェック付き）
      let storeCode: string
      let attempts = 0
      do {
        storeCode = generateStoreCode()
        const existingCode = await db.query.stores.findFirst({
          where: eq(stores.storeCode, storeCode),
        })
        if (!existingCode) break
        attempts++
      } while (attempts < 10)
      
      if (attempts >= 10) {
        logError('店舗ID ${store.id} の店舗コード生成に失敗', new Error('店舗ID ${store.id} の店舗コード生成に失敗'))
        continue
      }
      
      // 店舗コードを更新
      await db.update(stores)
        .set({ storeCode })
        .where(eq(stores.id, store.id))
      
      // console.log(`店舗 "${store.name}" (ID: ${store.id}) に店舗コード "${storeCode}" を設定`)
    }
    
    // console.log('店舗コードの追加が完了しました！')
    
  } catch (error) {
    logError('エラーが発生しました:', error)
  }
  
  process.exit(0)
}

addStoreCodes()