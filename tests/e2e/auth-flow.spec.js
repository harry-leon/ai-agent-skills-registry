import { test, expect } from '@playwright/test';

test.describe('Milestone M1.2: Authentication End-to-End Browser Flows', () => {
  test('Registration, Login, Navigation, and Forgot-Password Flow', async ({ page }, testInfo) => {
    const projSlug = testInfo.project.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = Math.floor(Math.random() * 10000);
    const testHandle = `u-${projSlug}-${rand}`.slice(0, 20);
    const testEmail = `${testHandle}@skillvault.local`;
    const testName = `User ${testInfo.project.name}`;
    const testPassword = 'SecurePassword123!';

    // 1. Visit landing page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Agent Skills');

    // 2. Navigate to Register page
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Tạo tài khoản');

    // Fill registration form
    await page.fill('#name', testName);
    await page.fill('#handle', testHandle);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);

    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Thư viện của tôi');

    // Verify handle badge in navbar
    await expect(page.locator('header')).toContainText(`@${testHandle}`);

    // 3. Logout
    await page.click('button:has-text("Đăng xuất")');
    await page.waitForURL('**/login', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Đăng nhập');

    // 4. Login with newly created credentials
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Thư viện của tôi');

    // 5. Navigate to Settings page
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Cài đặt tài khoản');
    await expect(page.locator('body')).toContainText(`@${testHandle}`);

    // 6. Test Forgot-Password flow
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toContainText('Khôi phục mật khẩu');
    await page.fill('#email', testEmail);
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText('Nếu email tồn tại trong hệ thống');
  });

  test('Guarded layout redirects unauthenticated access', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Đăng nhập');
  });
});
