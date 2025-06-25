const { chromium } = require('playwright');

async function testAdminTimezoneDisplay() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📝 Testing with created admin account...');
    
    // 管理画面にアクセス
    console.log('🔍 Accessing admin login page...');
    await page.goto('http://35.72.96.45:3002');
    await page.waitForLoadState('networkidle');

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

    // メールアドレス入力フィールドを探す
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // ログイン (作成したテストアカウントを使用)
    console.log('🔐 Logging in with test account...');
    await page.fill('input[type="email"], input[name="email"]', 'timetest@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    
    // ログインボタンをクリック
    await page.click('button:has-text("ログイン")');
    
    // ログイン完了まで待機
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`📍 After login URL: ${currentUrl}`);
    
    // ログインが成功したかチェック
    if (currentUrl.includes('dashboard') || !currentUrl.includes('login')) {
      console.log('✅ Login successful');
      
      // ページタイトル確認
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);
      
      // メニュー管理に移動
      console.log('📋 Navigating to menu management...');
      try {
        // メニュー管理のリンクを探す
        const menuLink = page.locator('a:has-text("メニュー"), a[href*="menu"]').first();
        await menuLink.click({ timeout: 5000 });
        await page.waitForTimeout(3000);
        console.log(`📍 Menu page URL: ${page.url()}`);
      } catch (e) {
        console.log('⚠️ Could not find menu management link');
      }
      
      // 時刻表示をDOM全体から検索
      console.log('🔍 Searching for timestamp displays...');
      const timeDisplays = await page.evaluate(() => {
        const allText = document.body.innerText;
        const timePatterns = [
          /\d{4}年\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2}/g,
          /\d{4}年\d{1,2}月\d{1,2}日/g,
          /\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}/g,
          /\d{4}-\d{2}-\d{2}/g,
          /\d{4}\/\d{1,2}\/\d{1,2}/g,
          /\d{1,2}:\d{2}:\d{2}/g,
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
      
      console.log('🕒 Time displays found in admin interface:');
      if (timeDisplays.length > 0) {
        timeDisplays.forEach((time, index) => {
          console.log(`  ${index + 1}. "${time}"`);
        });
      } else {
        console.log('  ⚠️ No time displays found');
      }
      
      // メニューアイテムやカテゴリのテーブルを確認
      console.log('📊 Checking table data for timestamps...');
      const tableData = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'));
        const tableTexts = [];
        
        tables.forEach(table => {
          const rows = Array.from(table.querySelectorAll('tr'));
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            cells.forEach(cell => {
              const text = cell.textContent?.trim();
              if (text && (
                text.match(/\d{4}年\d{1,2}月\d{1,2}日/) ||
                text.match(/\d{4}-\d{2}-\d{2}/) ||
                text.match(/\d{1,2}:\d{2}/)
              )) {
                tableTexts.push(text);
              }
            });
          });
        });
        
        return [...new Set(tableTexts)];
      });
      
      if (tableData.length > 0) {
        console.log('📋 Table timestamp data:');
        tableData.forEach((data, index) => {
          console.log(`  ${index + 1}. "${data}"`);
        });
      }
      
      // 会計管理も確認
      console.log('💰 Checking accounting page...');
      try {
        const accountingLink = page.locator('a:has-text("会計"), a[href*="accounting"]').first();
        await accountingLink.click({ timeout: 5000 });
        await page.waitForTimeout(3000);
        
        const accountingTimes = await page.evaluate(() => {
          const allText = document.body.innerText;
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
        
        console.log('📊 Accounting page timestamps:');
        if (accountingTimes.length > 0) {
          accountingTimes.forEach((time, index) => {
            console.log(`  ${index + 1}. "${time}"`);
          });
        } else {
          console.log('  ⚠️ No timestamps in accounting page');
        }
        
      } catch (e) {
        console.log('⚠️ Could not access accounting page');
      }
      
    } else {
      console.log('❌ Login failed - still on login page');
      
      // エラーメッセージを確認
      try {
        const errorMessage = await page.textContent('.error, .alert, [class*="error"]');
        if (errorMessage) {
          console.log(`❌ Error message: ${errorMessage}`);
        }
      } catch (e) {
        // エラーメッセージ要素が見つからない場合
      }
    }
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/admin-timezone-final.png',
      fullPage: true 
    });
    console.log('📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/admin-timezone-error.png' 
    });
  } finally {
    await browser.close();
  }
}

testAdminTimezoneDisplay().catch(console.error);