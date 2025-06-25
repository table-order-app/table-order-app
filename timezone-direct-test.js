const { chromium } = require('playwright');

async function checkTimezoneDisplay() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📝 Starting direct timezone display test...');
    
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
    
    // 管理画面に直接アクセス
    console.log('🔍 Accessing admin page...');
    await page.goto('http://35.72.96.45:3002', { waitUntil: 'networkidle' });
    
    // ページの情報を取得
    const title = await page.title();
    const url = page.url();
    console.log(`📍 Page: ${title} (${url})`);
    
    // スクリーンショットを撮影
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/admin-page-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as admin-page-screenshot.png');
    
    // ページ内の全テキストから時刻パターンを抽出
    const allTimeDisplays = await page.evaluate(() => {
      const allText = document.body.innerText;
      console.log('Page text preview:', allText.substring(0, 500));
      
      const timePatterns = [
        /\d{4}年\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2}/g,
        /\d{4}年\d{1,2}月\d{1,2}日/g,
        /\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}/g,
        /\d{4}-\d{2}-\d{2}/g,
        /\d{4}\/\d{1,2}\/\d{1,2}/g,
        /\d{1,2}:\d{2}:\d{2}/g,
        /\d{1,2}:\d{2}/g,
        /登録日.*?\d{4}/g,
        /作成日.*?\d{4}/g,
        /更新日.*?\d{4}/g
      ];
      
      const matches = [];
      timePatterns.forEach((pattern, index) => {
        const found = allText.match(pattern);
        if (found) {
          console.log(`Pattern ${index + 1} found:`, found);
          matches.push(...found);
        }
      });
      
      return [...new Set(matches)];
    });
    
    console.log('🕒 Time displays found on admin page:');
    if (allTimeDisplays.length > 0) {
      allTimeDisplays.forEach((time, index) => {
        console.log(`  ${index + 1}. "${time}"`);
      });
    } else {
      console.log('  ⚠️ No time displays found');
    }
    
    // 具体的な要素を探す
    console.log('🔍 Looking for specific time elements...');
    
    const timeElements = await page.locator('td, span, div').evaluateAll(elements => {
      return elements
        .map(el => el.textContent?.trim())
        .filter(text => text && (
          /\d{4}年\d{1,2}月\d{1,2}日/.test(text) ||
          /\d{4}-\d{2}-\d{2}/.test(text) ||
          /\d{4}\/\d{1,2}\/\d{1,2}/.test(text) ||
          /\d{1,2}:\d{2}/.test(text)
        ))
        .slice(0, 10); // 最初の10個まで
    });
    
    if (timeElements.length > 0) {
      console.log('📅 Time elements found:');
      timeElements.forEach((time, index) => {
        console.log(`  ${index + 1}. "${time}"`);
      });
    }
    
    // ブラウザ時刻確認
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
    
    // ログインが必要かチェック
    const hasLoginForm = await page.locator('input[type="password"], input[name="password"]').count() > 0;
    if (hasLoginForm) {
      console.log('🔐 Login form detected - this explains limited content');
    }
    
    // ページのHTML構造の一部を確認
    const bodyHTML = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 1000);
    });
    console.log('📄 Page HTML preview:', bodyHTML);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/error-screenshot.png' 
    });
  } finally {
    await browser.close();
  }
}

checkTimezoneDisplay();