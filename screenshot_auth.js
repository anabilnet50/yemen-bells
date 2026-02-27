import { chromium } from 'playwright';
import path from 'path';

(async () => {
    const adminUrl = 'http://localhost:3000/admin';
    const outDir = 'C:/Users/Almuhtarif-One/.gemini/antigravity/brain/dd6fde83-8a85-4d15-bc8c-c327c7c9aa5c/';

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Login Screen
    await page.goto(adminUrl);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'admin_login_ui_1772183204928.webp'), fullPage: true });

    // Forgot Password Screen
    await page.click('text=نسيت كلمة المرور؟');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'admin_forgot_password_ui_1772183204928.webp'), fullPage: true });

    // Verify Code Screen
    await page.fill('input[type="email"]', 'admin@example.com');
    // Mock the API response to avoid sending an actual email/failing
    await page.route('**/api/auth/forgot-password', route => route.fulfill({ status: 200, json: { message: 'sent' } }));
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'admin_verify_code_ui_1772183204928.webp'), fullPage: true });

    await browser.close();
})();
