const { chromium } = require('playwright');

async function checkTimezoneAfterLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📝 Starting timezone test with login...');
    
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
    console.log('🔍 Accessing admin page...');
    await page.goto('http://35.72.96.45:3002', { waitUntil: 'networkidle' });
    
    // ログイン試行
    console.log('🔐 Attempting login...');
    
    // メールアドレス入力（複数のパターンを試す）
    const emailSelectors = ['input[type="email"]', 'input[id="email"]', 'input[name="email"]'];
    let emailFilled = false;
    
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.fill(selector, 'admin@example.com');
        console.log(`✅ Email filled using selector: ${selector}`);
        emailFilled = true;
        break;
      } catch (e) {
        console.log(`❌ Email selector failed: ${selector}`);
      }
    }
    
    // パスワード入力
    const passwordSelectors = ['input[type="password"]', 'input[id="password"]', 'input[name="password"]'];
    let passwordFilled = false;
    
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.fill(selector, 'password123');
        console.log(`✅ Password filled using selector: ${selector}`);
        passwordFilled = true;
        break;
      } catch (e) {
        console.log(`❌ Password selector failed: ${selector}`);
      }
    }
    
    if (emailFilled && passwordFilled) {
      // ログインボタンクリック
      const submitSelectors = ['button[type="submit"]', 'button:has-text("ログイン")', 'button:has-text("Sign")', 'input[type="submit"]'];
      
      for (const selector of submitSelectors) {
        try {
          await page.click(selector);
          console.log(`✅ Login button clicked: ${selector}`);
          break;
        } catch (e) {
          console.log(`❌ Submit selector failed: ${selector}`);
        }
      }
      
      // ログイン後のページ遷移を待機
      await page.waitForTimeout(3000);
      console.log(`📍 After login URL: ${page.url()}`);
      
      // ダッシュボードまたはメニューページへの遷移を確認
      if (page.url().includes('dashboard') || page.url().includes('menu') || !page.url().includes('login')) {
        console.log('✅ Login appeared successful');
        
        // 時刻表示を探す
        await page.waitForTimeout(2000);
        
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
        
        console.log('🕒 Time displays found after login:');
        if (timeDisplays.length > 0) {
          timeDisplays.forEach((time, index) => {
            console.log(`  ${index + 1}. "${time}"`);
          });
        } else {
          console.log('  ⚠️ No time displays found');
        }
        
        // メニュー管理ページに移動を試す
        console.log('📋 Trying to navigate to menu management...');
        try {
          // メニュー管理リンクを探す
          const menuLinks = await page.locator('a:has-text("メニュー"), a:has-text("menu"), a[href*="menu"]').all();
          
          if (menuLinks.length > 0) {
            await menuLinks[0].click();
            await page.waitForTimeout(3000);
            console.log(`📍 Menu page URL: ${page.url()}`);
            
            // メニューページでの時刻表示確認
            const menuTimeDisplays = await page.evaluate(() => {
              const allText = document.body.innerText;
              const timePatterns = [
                /\d{4}年\d{1,2}月\d{1,2}日/g,
                /\d{4}-\d{2}-\d{2}/g,
                /\d{4}\/\d{1,2}\/\d{1,2}/g,
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
            
            console.log('🍽️ Menu page time displays:');
            if (menuTimeDisplays.length > 0) {
              menuTimeDisplays.forEach((time, index) => {
                console.log(`  ${index + 1}. "${time}"`);
              });
            } else {
              console.log('  ⚠️ No time displays found in menu page');
            }
          }
        } catch (e) {
          console.log('⚠️ Could not navigate to menu page:', e.message);
        }
        
      } else {
        console.log('❌ Login failed - still on login page');
      }
    } else {
      console.log('❌ Could not find login form elements');
    }
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/final-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Final screenshot saved');
    
    // ページの現在の内容を一部確認
    const currentContent = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });
    console.log('📄 Current page content preview:', currentContent);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ 
      path: '/Users/itouharuki/hukugyou/tableorder/dev/error-final.png' 
    });
  } finally {
    await browser.close();
  }
}

checkTimezoneAfterLogin();