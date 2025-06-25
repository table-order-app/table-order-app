const { chromium } = require('playwright');

async function testTimezoneDisplay() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📝 Starting timezone display test...');
    
    // 管理画面にアクセス
    console.log('🔍 Accessing admin login page...');
    await page.goto('http://35.72.96.45:3002');
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    // ログイン
    console.log('🔐 Logging in...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // ダッシュボードが表示されるまで待機
    await page.waitForSelector('h1', { timeout: 15000 });
    console.log('✅ Login successful');
    
    // メニュー管理画面に移動
    console.log('📋 Navigating to menu management...');
    try {
      await page.click('text=メニュー管理');
    } catch {
      await page.click('a[href*="menu"]');
    }
    await page.waitForTimeout(2000);
    
    // 現在のページのタイトルとURLを確認
    const currentUrl = page.url();
    const title = await page.title();
    console.log(`📍 Current page: ${title} (${currentUrl})`);
    
    // メニューアイテムの時刻表示を確認
    console.log('⏰ Checking menu item timestamps...');
    
    // テーブル内の時刻表示を探す
    const timeElements = await page.locator('td').all();
    let foundTimeDisplays = [];
    
    for (let element of timeElements) {
      const text = await element.textContent();
      // 日付や時刻らしきパターンを検索
      if (text && (
        text.includes('年') || 
        text.includes('月') || 
        text.includes('日') ||
        text.match(/\d{4}-\d{2}-\d{2}/) ||
        text.match(/\d{2}:\d{2}/) ||
        text.includes('/')
      )) {
        foundTimeDisplays.push(text.trim());
      }
    }
    
    if (foundTimeDisplays.length > 0) {
      console.log('🕒 Found time displays:');
      foundTimeDisplays.forEach((time, index) => {
        console.log(`  ${index + 1}. ${time}`);
      });
    } else {
      console.log('⚠️  No time displays found in menu management');
    }
    
    // 会計管理画面も確認
    console.log('💰 Checking accounting page...');
    try {
      await page.click('text=会計管理');
      await page.waitForTimeout(2000);
      
      const accountingTimeElements = await page.locator('td').all();
      let accountingTimes = [];
      
      for (let element of accountingTimeElements) {
        const text = await element.textContent();
        if (text && (
          text.includes('年') || 
          text.includes('月') || 
          text.includes('日') ||
          text.match(/\d{4}-\d{2}-\d{2}/) ||
          text.match(/\d{2}:\d{2}/)
        )) {
          accountingTimes.push(text.trim());
        }
      }
      
      if (accountingTimes.length > 0) {
        console.log('📊 Found accounting time displays:');
        accountingTimes.forEach((time, index) => {
          console.log(`  ${index + 1}. ${time}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not access accounting page:', error.message);
    }
    
    // 現在のシステム時刻とブラウザ時刻を比較
    console.log('🌍 Timezone comparison:');
    const serverTime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const browserTime = await page.evaluate(() => {
      return new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    });
    
    console.log(`  Server JST: ${serverTime}`);
    console.log(`  Browser JST: ${browserTime}`);
    
    // スクリーンショットを撮影
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/timezone-test-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as timezone-test-screenshot.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/timezone-test-error.png' 
    });
  } finally {
    await browser.close();
  }
}

testTimezoneDisplay();