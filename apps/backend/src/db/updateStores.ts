/**
 * 店舗テーブルにstore_codeカラムを追加し、既存店舗にコードを設定
 */
import 'dotenv/config'
import pkg from 'pg'
const { Client } = pkg
import { generateStoreCode } from '../utils/storeCode'
import { logError } from '../utils/logger-simple'

async function updateStores() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'accorto',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  try {
    await client.connect()
    // console.log('データベースに接続しました')

    // 1. store_codeカラムが存在するかチェック
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stores' AND column_name = 'store_code'
    `)

    if (columnCheck.rows.length === 0) {
      // console.log('store_codeカラムを追加中...')
      
      // 2. store_codeカラムを追加
      await client.query(`
        ALTER TABLE stores 
        ADD COLUMN store_code varchar(8) UNIQUE
      `)
      // console.log('store_codeカラムを追加しました')
    } else {
      // console.log('store_codeカラムは既に存在します')
    }

    // 3. store_codeが未設定の店舗を取得
    const storesResult = await client.query(`
      SELECT id, name 
      FROM stores 
      WHERE store_code IS NULL
    `)

    // console.log(`店舗コード未設定の店舗: ${storesResult.rows.length}件`)

    // 4. 各店舗に店舗コードを設定
    for (const store of storesResult.rows) {
      let storeCode: string
      let attempts = 0
      
      do {
        storeCode = generateStoreCode()
        
        // 重複チェック
        const duplicateCheck = await client.query(
          'SELECT id FROM stores WHERE store_code = $1',
          [storeCode]
        )
        
        if (duplicateCheck.rows.length === 0) break
        attempts++
      } while (attempts < 10)

      if (attempts >= 10) {
        logError('店舗ID ${store.id} の店舗コード生成に失敗', new Error('店舗ID ${store.id} の店舗コード生成に失敗'))
        continue
      }

      // 店舗コードを更新
      await client.query(
        'UPDATE stores SET store_code = $1 WHERE id = $2',
        [storeCode, store.id]
      )

      // console.log(`店舗 "${store.name}" (ID: ${store.id}) に店舗コード "${storeCode}" を設定`)
    }

    // console.log('✅ 店舗コードの設定が完了しました！')

  } catch (error) {
    logError('❌ エラーが発生しました:', error)
  } finally {
    await client.end()
  }
}

updateStores()