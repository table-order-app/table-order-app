#!/usr/bin/env node

/**
 * パスワードマイグレーションスクリプト
 * 既存のBase64パスワードをbcryptハッシュに変換
 */

const bcrypt = require('bcryptjs');
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const postgres = require('postgres');

// 環境変数の読み込み
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function migratePasswords() {
  console.log('🔄 Starting password migration...');
  
  try {
    // データベース接続
    const sql = postgres(DATABASE_URL);
    const db = drizzle(sql);
    
    // 店舗パスワードのマイグレーション
    console.log('📋 Migrating store passwords...');
    const stores = await sql`SELECT id, email, password FROM stores WHERE password IS NOT NULL`;
    
    for (const store of stores) {
      try {
        // Base64パスワードをデコード
        const originalPassword = Buffer.from(store.password, 'base64').toString('utf-8');
        
        // bcryptでハッシュ化
        const hashedPassword = await bcrypt.hash(originalPassword, 12);
        
        // データベース更新
        await sql`UPDATE stores SET password = ${hashedPassword} WHERE id = ${store.id}`;
        
        console.log(`✅ Migrated password for store: ${store.email}`);
      } catch (error) {
        console.error(`❌ Failed to migrate store ${store.email}:`, error.message);
      }
    }
    
    // スタッフパスワードのマイグレーション
    console.log('👥 Migrating staff passwords...');
    const staffMembers = await sql`SELECT id, login_id, password FROM staff_members WHERE password IS NOT NULL`;
    
    for (const staff of staffMembers) {
      try {
        // Base64パスワードをデコード
        const originalPassword = Buffer.from(staff.password, 'base64').toString('utf-8');
        
        // bcryptでハッシュ化
        const hashedPassword = await bcrypt.hash(originalPassword, 12);
        
        // データベース更新
        await sql`UPDATE staff_members SET password = ${hashedPassword} WHERE id = ${staff.id}`;
        
        console.log(`✅ Migrated password for staff: ${staff.login_id}`);
      } catch (error) {
        console.error(`❌ Failed to migrate staff ${staff.login_id}:`, error.message);
      }
    }
    
    console.log('🎉 Password migration completed successfully!');
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// メイン実行
if (require.main === module) {
  migratePasswords();
}

module.exports = { migratePasswords };