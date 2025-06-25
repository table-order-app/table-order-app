import { chromium, Browser, Page } from 'playwright';

async function testTimezoneDisplay(): Promise<void> {
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

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
    
    // 現在のシステム時刻を記録
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
        console.log('⚠️  Could not find menu management link, checking current page...');
      }
    }
    
    // 現在のページ情報
    const currentUrl = page.url();
    const title = await page.title();
    console.log(`📍 Current page: ${title} (${currentUrl})`);
    
    // メニューアイテムの時刻表示を確認
    console.log('⏰ Checking for timestamp displays...');
    
    // さまざまな時刻表示パターンを検索
    const timeSelectors = [
      'td:has-text("年")',
      'td:has-text("月")',
      'td:has-text("日")',
      'td:has-text(":")',
      'td:has-text("/")',
      'span:has-text("年")',
      'span:has-text("月")',
      'span:has-text("日")',
      'div:has-text("年")',
      'div:has-text("月")',
      'div:has-text("日")',
      '[class*="date"]',
      '[class*="time"]',
      '[class*="created"]',
      '[class*="updated"]'
    ];
    
    const foundTimeDisplays: string[] = [];
    
    for (const selector of timeSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            // 時刻らしきパターンをより厳密にチェック
            if (
              text.match(/\d{4}年\d{1,2}月\d{1,2}日/) ||
              text.match(/\d{4}-\d{2}-\d{2}/) ||
              text.match(/\d{4}\/\d{1,2}\/\d{1,2}/) ||
              text.match(/\d{1,2}:\d{2}/) ||
              (text.includes('年') && text.includes('月') && text.includes('日'))
            ) {
              const cleanText = text.trim().replace(/\s+/g, ' ');
              if (!foundTimeDisplays.includes(cleanText)) {
                foundTimeDisplays.push(cleanText);
              }
            }
          }
        }
      } catch (e) {
        // セレクタが見つからない場合は続行
      }
    }
    
    if (foundTimeDisplays.length > 0) {
      console.log('🕒 Found time displays:');
      foundTimeDisplays.forEach((time, index) => {
        console.log(`  ${index + 1}. "${time}"`);
      });
    } else {
      console.log('⚠️  No time displays found with current selectors');
    }
    
    // 会計管理画面も確認
    console.log('💰 Checking accounting page...');
    try {
      await page.click('text=会計管理');
      await page.waitForTimeout(3000);
      
      console.log(`📍 Accounting page URL: ${page.url()}`);
      
      // 会計ページでの時刻表示確認
      const accountingTimes: string[] = [];
      
      for (const selector of timeSelectors) {
        try {
          const elements = await page.locator(selector).all();
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.trim()) {
              if (
                text.match(/\d{4}年\d{1,2}月\d{1,2}日/) ||
                text.match(/\d{4}-\d{2}-\d{2}/) ||
                text.match(/\d{4}\/\d{1,2}\/\d{1,2}/) ||
                text.match(/\d{1,2}:\d{2}/)
              ) {
                const cleanText = text.trim().replace(/\s+/g, ' ');
                if (!accountingTimes.includes(cleanText)) {
                  accountingTimes.push(cleanText);
                }
              }
            }
          }
        } catch (e) {
          // セレクタが見つからない場合は続行
        }
      }
      
      if (accountingTimes.length > 0) {
        console.log('📊 Found accounting time displays:');
        accountingTimes.forEach((time, index) => {
          console.log(`  ${index + 1}. "${time}"`);
        });
      } else {
        console.log('⚠️  No time displays found in accounting page');
      }
      
    } catch (error) {
      console.log('⚠️  Could not access accounting page:', (error as Error).message);
    }
    
    // ブラウザとサーバーの時刻比較
    console.log('🌍 Timezone comparison:');
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
    
    console.log(`  Server JST: ${currentJST}`);
    console.log(`  Browser JST: ${browserTime}`);
    
    // スクリーンショットを撮影
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/timezone-test-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as timezone-test-screenshot.png');
    
    // DOM全体から時刻らしきテキストを抽出
    console.log('🔍 Searching entire DOM for time patterns...');
    const allTimeTexts = await page.evaluate(() => {
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
      
      return [...new Set(matches)]; // 重複除去
    });
    
    if (allTimeTexts.length > 0) {
      console.log('📅 All time patterns found in DOM:');
      allTimeTexts.forEach((time, index) => {
        console.log(`  ${index + 1}. "${time}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/timezone-test-error.png' 
    });
  } finally {
    await browser.close();
  }
}

testTimezoneDisplay().catch(console.error);