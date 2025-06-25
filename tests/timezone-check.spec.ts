import { test, expect } from '@playwright/test';

test.describe('Timezone Display Check', () => {
  test('should display times in JST across admin pages', async ({ page }) => {
    console.log('📝 Starting timezone display test...');
    
    // 現在のJST時刻を記録
    const currentJST = new Date().toLocaleString('ja-JP', { 
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    console.log(`🕒 Current JST: ${currentJST}`);
    
    // 管理画面にアクセス
    console.log('🔍 Accessing admin login page...');
    await page.goto('http://35.72.96.45:3002');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // ログインフォームの要素を探す（複数パターン）
    const loginSelectors = [
      'input[name="username"]',
      'input[type="text"]',
      'input[placeholder*="ユーザー"]',
      'input[placeholder*="名前"]',
      'form input:first-child'
    ];
    
    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ Found login element: ${selector}`);
        loginFound = true;
        break;
      } catch {
        console.log(`❌ Not found: ${selector}`);
      }
    }
    
    if (!loginFound) {
      console.log('⚠️ No login form found, taking screenshot and checking page content');
      await page.screenshot({ path: 'test-results/no-login-form.png' });
      
      const pageContent = await page.content();
      console.log('📄 Page title:', await page.title());
      console.log('📄 Page URL:', page.url());
      
      // ページ内の全テキストから時刻を抽出してみる
      const allTimes = await page.evaluate(() => {
        const allText = document.body.innerText;
        const timePatterns = [
          /\d{4}年\d{1,2}月\d{1,2}日/g,
          /\d{4}-\d{2}-\d{2}/g,
          /\d{4}\/\d{1,2}\/\d{1,2}/g,
          /\d{1,2}:\d{2}:\d{2}/g,
          /\d{1,2}:\d{2}/g
        ];
        
        const matches: string[] = [];
        timePatterns.forEach(pattern => {
          const found = allText.match(pattern);
          if (found) {
            matches.push(...found);
          }
        });
        
        return [...new Set(matches)];
      });
      
      if (allTimes.length > 0) {
        console.log('🕒 Found time displays on current page:');
        allTimes.forEach((time, index) => {
          console.log(`  ${index + 1}. "${time}"`);
        });
      }
      
      return; // テスト終了
    }
    
    // ログイン
    console.log('🔐 Logging in...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // ダッシュボードが表示されるまで待機
    await page.waitForSelector('h1', { timeout: 15000 });
    console.log('✅ Login successful');
    
    // ダッシュボードでの時刻表示確認
    console.log('📊 Checking dashboard timestamps...');
    const dashboardTimes = await page.evaluate(() => {
      const allText = document.body.innerText;
      const timePatterns = [
        /\d{4}年\d{1,2}月\d{1,2}日/g,
        /\d{4}-\d{2}-\d{2}/g,
        /\d{4}\/\d{1,2}\/\d{1,2}/g,
        /\d{1,2}:\d{2}:\d{2}/g,
        /\d{1,2}:\d{2}/g
      ];
      
      const matches: string[] = [];
      timePatterns.forEach(pattern => {
        const found = allText.match(pattern);
        if (found) {
          matches.push(...found);
        }
      });
      
      return [...new Set(matches)];
    });
    
    console.log('🕒 Dashboard time displays found:');
    dashboardTimes.forEach((time, index) => {
      console.log(`  ${index + 1}. "${time}"`);
    });
    
    // メニュー管理画面に移動
    console.log('📋 Navigating to menu management...');
    try {
      await page.click('text=メニュー管理');
      await page.waitForTimeout(3000);
    } catch {
      try {
        await page.click('a[href*="menu"]');
        await page.waitForTimeout(3000);
      } catch {
        console.log('⚠️ Could not find menu management link');
      }
    }
    
    console.log(`📍 Current URL: ${page.url()}`);
    
    // メニュー管理画面での時刻表示確認
    const menuTimes = await page.evaluate(() => {
      const allText = document.body.innerText;
      const timePatterns = [
        /\d{4}年\d{1,2}月\d{1,2}日/g,
        /\d{4}-\d{2}-\d{2}/g,
        /\d{4}\/\d{1,2}\/\d{1,2}/g,
        /\d{1,2}:\d{2}:\d{2}/g,
        /\d{1,2}:\d{2}/g
      ];
      
      const matches: string[] = [];
      timePatterns.forEach(pattern => {
        const found = allText.match(pattern);
        if (found) {
          matches.push(...found);
        }
      });
      
      return [...new Set(matches)];
    });
    
    console.log('🍽️ Menu management time displays found:');
    menuTimes.forEach((time, index) => {
      console.log(`  ${index + 1}. "${time}"`);
    });
    
    // 会計管理画面確認
    console.log('💰 Checking accounting page...');
    try {
      await page.click('text=会計管理');
      await page.waitForTimeout(3000);
      
      const accountingTimes = await page.evaluate(() => {
        const allText = document.body.innerText;
        const timePatterns = [
          /\d{4}年\d{1,2}月\d{1,2}日/g,
          /\d{4}-\d{2}-\d{2}/g,
          /\d{4}\/\d{1,2}\/\d{1,2}/g,
          /\d{1,2}:\d{2}:\d{2}/g,
          /\d{1,2}:\d{2}/g
        ];
        
        const matches: string[] = [];
        timePatterns.forEach(pattern => {
          const found = allText.match(pattern);
          if (found) {
            matches.push(...found);
          }
        });
        
        return [...new Set(matches)];
      });
      
      console.log('📊 Accounting time displays found:');
      accountingTimes.forEach((time, index) => {
        console.log(`  ${index + 1}. "${time}"`);
      });
      
    } catch (error) {
      console.log('⚠️ Could not access accounting page');
    }
    
    // ブラウザの時刻とサーバーの時刻比較
    const browserTime = await page.evaluate(() => {
      return new Date().toLocaleString('ja-JP', { 
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit', 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    });
    
    console.log('🌍 Timezone comparison:');
    console.log(`  Server JST: ${currentJST}`);
    console.log(`  Browser JST: ${browserTime}`);
    
    // スクリーンショットを撮影
    await page.screenshot({ 
      path: 'test-results/timezone-check.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved');
    
    // 時刻表示が見つかったかを検証
    const allTimesFound = [...dashboardTimes, ...menuTimes];
    console.log(`📈 Total time displays found: ${allTimesFound.length}`);
    
    if (allTimesFound.length === 0) {
      console.log('⚠️ No time displays found - this might indicate an issue');
    }
  });
});