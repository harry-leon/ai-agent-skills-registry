import { test, expect } from '@playwright/test';

test.describe('Milestone M1.2: Authentication End-to-End Browser Flows', () => {
  test('Registration, Login, Navigation, and Forgot-Password Flow', async ({ page }, testInfo) => {
    const projSlug = testInfo.project.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = Math.floor(Math.random() * 10000);
    const testHandle = `u-${projSlug}-${rand}`.slice(0, 20);
    const testEmail = `${testHandle}@skillvault.local`;
    const testName = `User ${testInfo.project.name}`;
    const testPassword = 'SecurePassword123!';

    // 1. Visit landing page (redirects to /public for guests)
    await page.goto('/');
    await page.waitForURL('**/public', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Community Skills');

    // 2. Navigate to Register page
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Create Account');

    // Fill registration form
    await page.fill('#name', testName);
    await page.fill('#handle', testHandle);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);

    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('My Skills');

    // Verify handle badge in navbar/sidebar
    await expect(page.locator('body')).toContainText(`@${testHandle}`);

    // 3. Logout
    const hamburger = page.locator('button[aria-label="Toggle navigation menu"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
    }
    const logoutBtn = page.locator('button[aria-label="Sign Out"]').filter({ visible: true }).first();
    await logoutBtn.click();
    await page.waitForURL('**/login', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Sign In');

    // 4. Login with newly created credentials
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('My Skills');

    // 5. Navigate to Settings page
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Account Settings');
    await expect(page.locator('body')).toContainText(`@${testHandle}`);

    // 6. Test Forgot-Password flow
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toContainText('Reset Password');
    await page.fill('#email', testEmail);
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText('If that email exists in our system');
  });

  test('Guarded layout redirects unauthenticated access', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Sign In');
  });
});
