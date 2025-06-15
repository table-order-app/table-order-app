/**
 * 既存のローカル画像ファイルをCloudflare R2に移行するスクリプト
 */

import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../db'
import { menuItems } from '../db/schema'
import { isNotNull, like } from 'drizzle-orm'
import { uploadImageToR2, isR2Enabled } from '../utils/r2'

interface MigrationResult {
  success: number
  failed: number
  skipped: number
  errors: Array<{ file: string; error: string }>
}

/**
 * ローカルの画像ファイルをR2に移行
 */
async function migrateImagesToR2(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }

  // R2が有効でない場合は処理を中止
  if (!isR2Enabled()) {
    console.error('❌ R2が有効になっていません。環境変数を確認してください。')
    return result
  }

  console.log('🚀 画像ファイルのR2移行を開始します...')
  
  try {
    // データベースから画像パスを持つメニューアイテムを取得
    const menuItemsWithImages = await db.select()
      .from(menuItems)
      .where(isNotNull(menuItems.image))

    console.log(`📋 ${menuItemsWithImages.length}個のメニューアイテムに画像が設定されています`)

    for (const item of menuItemsWithImages) {
      if (!item.image) continue

      // 既にR2のURLの場合はスキップ
      if (item.image.includes('r2.dev') || item.image.includes('cloudflarestorage.com')) {
        console.log(`⏭️  既にR2のURL: ${item.image}`)
        result.skipped++
        continue
      }

      // ローカルファイルパスの場合のみ処理
      if (!item.image.startsWith('/uploads/')) {
        console.log(`⏭️  ローカルファイルではない: ${item.image}`)
        result.skipped++
        continue
      }

      try {
        // ローカルファイルの存在確認
        const localFilePath = path.join('./public', item.image)
        
        try {
          await fs.access(localFilePath)
        } catch {
          console.log(`⚠️  ローカルファイルが見つかりません: ${localFilePath}`)
          result.errors.push({ file: item.image, error: 'File not found' })
          result.failed++
          continue
        }

        // ファイルを読み込んでFileオブジェクトを作成
        const fileBuffer = await fs.readFile(localFilePath)
        const fileName = path.basename(localFilePath)
        const fileExtension = path.extname(fileName).substring(1)
        
        // File-like オブジェクトを作成
        const file = {
          name: fileName,
          size: fileBuffer.length,
          type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          arrayBuffer: async () => fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
        } as File

        // R2にアップロード
        console.log(`📤 アップロード中: ${fileName}`)
        const r2Url = await uploadImageToR2(file, 'menu')

        // データベースの画像URLを更新
        await db.update(menuItems)
          .set({ image: r2Url })
          .where(menuItems.id.eq(item.id))

        console.log(`✅ 移行完了: ${fileName} -> ${r2Url}`)
        result.success++

      } catch (error) {
        console.error(`❌ 移行失敗: ${item.image}`, error)
        result.errors.push({ 
          file: item.image, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        result.failed++
      }
    }

  } catch (error) {
    console.error('❌ 移行処理中にエラーが発生しました:', error)
    throw error
  }

  return result
}

/**
 * 移行結果をレポート
 */
function reportMigrationResult(result: MigrationResult) {
  console.log('\n📊 移行結果レポート')
  console.log('='.repeat(50))
  console.log(`✅ 成功: ${result.success}件`)
  console.log(`❌ 失敗: ${result.failed}件`)
  console.log(`⏭️  スキップ: ${result.skipped}件`)
  
  if (result.errors.length > 0) {
    console.log('\n❌ エラー詳細:')
    result.errors.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`)
    })
  }

  console.log('\n🎉 移行処理が完了しました!')
}

/**
 * 移行の実行確認
 */
async function confirmMigration(): Promise<boolean> {
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('⚠️  この操作により既存の画像URLがR2のURLに変更されます。続行しますか? (y/N): ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    console.log('🔄 Cloudflare R2 画像移行ツール')
    console.log('='.repeat(50))

    // 移行前の確認
    const shouldProceed = await confirmMigration()
    if (!shouldProceed) {
      console.log('❌ 移行がキャンセルされました。')
      process.exit(0)
    }

    // 移行実行
    const result = await migrateImagesToR2()
    
    // 結果レポート
    reportMigrationResult(result)

    // 成功した場合はローカルファイルの削除を推奨
    if (result.success > 0) {
      console.log('\n💡 移行が成功しました！')
      console.log('   必要に応じて、./public/uploads/ 以下のファイルを削除できます。')
      console.log('   ただし、削除前にR2での動作確認をお勧めします。')
    }

  } catch (error) {
    console.error('❌ 移行処理でエラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプトが直接実行された場合のみmain()を実行
if (require.main === module) {
  main()
}

export { migrateImagesToR2, MigrationResult }