const { chromium } = require('playwright');

async function testMenuTimestamps() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📝 Testing menu timestamps in admin interface...');
    
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
    await page.waitForLoadState('networkidle');

    // ログイン
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', 'timetest@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("ログイン")');
    await page.waitForTimeout(3000);
    
    console.log(`📍 After login: ${page.url()}`);
    
    // メニュー管理に移動 (ボタンをクリック)
    console.log('📋 Clicking menu management button...');
    await page.click('text=メニュー管理へ');
    await page.waitForTimeout(3000);
    
    console.log(`📍 Menu page URL: ${page.url()}`);
    
    // メニューカテゴリやアイテムのリストを確認
    console.log('🔍 Looking for menu categories and items...');
    
    // まずページ全体のスクリーンショットを撮る
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/menu-page-screenshot.png',
      fullPage: true 
    });
    
    // カテゴリリストを確認
    try {
      await page.click('text=カテゴリ');
      await page.waitForTimeout(2000);
      console.log('📂 Checking categories page...');
      
      const categoryTimes = await page.evaluate(() => {
        const allText = document.body.innerText;
        console.log('Category page text preview:', allText.substring(0, 1000));
        
        const timePatterns = [
          /\d{4}年\d{1,2}月\d{1,2}日/g,
          /\d{4}-\d{2}-\d{2}/g,
          /\d{1,2}:\d{2}/g,
          /作成日/g,
          /更新日/g,
          /登録日/g
        ];
        
        const matches = [];
        timePatterns.forEach(pattern => {
          const found = allText.match(pattern);
          if (found) {
            matches.push(...found);
          }
        });
        
        return [...new Set(matches)];
      });
      
      console.log('📅 Category timestamps found:');
      if (categoryTimes.length > 0) {
        categoryTimes.forEach((time, index) => {
          console.log(`  ${index + 1}. "${time}"`);
        });
      } else {
        console.log('  ⚠️ No category timestamps found');
      }
      
    } catch (e) {
      console.log('⚠️ Could not access categories:', e.message);
    }
    
    // メニューアイテムを確認
    try {
      await page.click('text=メニューアイテム');
      await page.waitForTimeout(2000);
      console.log('🍽️ Checking menu items page...');
      
      const itemTimes = await page.evaluate(() => {
        const allText = document.body.innerText;
        console.log('Menu items text preview:', allText.substring(0, 1000));
        
        // テーブルのセルを個別に確認
        const tableCells = Array.from(document.querySelectorAll('td, th'));
        const cellTexts = tableCells.map(cell => cell.textContent?.trim()).filter(text => text);
        
        console.log('Table cells:', cellTexts.slice(0, 20));
        
        const timePatterns = [
          /\d{4}年\d{1,2}月\d{1,2}日/g,
          /\d{4}-\d{2}-\d{2}/g,
          /\d{1,2}:\d{2}/g
        ];
        
        const matches = [];
        timePatterns.forEach(pattern => {
          const found = allText.match(pattern);
          if (found) {
            matches.push(...found);
          }
        });
        
        return [...new Set(matches)];
      });
      
      console.log('🍽️ Menu item timestamps found:');
      if (itemTimes.length > 0) {
        itemTimes.forEach((time, index) => {
          console.log(`  ${index + 1}. "${time}"`);
        });
      } else {
        console.log('  ⚠️ No menu item timestamps found');
      }
      
    } catch (e) {
      console.log('⚠️ Could not access menu items:', e.message);
    }
    
    // 会計管理で注文データの時刻確認
    console.log('💰 Checking accounting for order timestamps...');
    try {
      await page.click('text=会計管理');
      await page.waitForTimeout(3000);
      
      const accountingTimes = await page.evaluate(() => {
        const allText = document.body.innerText;
        console.log('Accounting page text preview:', allText.substring(0, 1000));
        
        // テーブル内の日時データを探す
        const tableCells = Array.from(document.querySelectorAll('td, th'));
        const cellTexts = tableCells.map(cell => cell.textContent?.trim()).filter(text => text);
        
        console.log('Accounting table cells:', cellTexts.slice(0, 20));
        
        const timePatterns = [
          /\d{4}年\d{1,2}月\d{1,2}日/g,
          /\d{4}-\d{2}-\d{2}/g,
          /\d{1,2}:\d{2}/g
        ];
        
        const matches = [];
        timePatterns.forEach(pattern => {
          const found = allText.match(pattern);
          if (found) {
            matches.push(...found);
          }
        });
        
        return [...new Set(matches)];
      });
      
      console.log('📊 Accounting timestamps found:');
      if (accountingTimes.length > 0) {
        accountingTimes.forEach((time, index) => {
          console.log(`  ${index + 1}. "${time}"`);
        });
      } else {
        console.log('  ⚠️ No accounting timestamps found');
      }
      
    } catch (e) {
      console.log('⚠️ Could not access accounting:', e.message);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/final-menu-test.png',
      fullPage: true 
    });
    console.log('📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/menu-test-error.png' 
    });
  } finally {
    await browser.close();
  }
}

testMenuTimestamps().catch(console.error);