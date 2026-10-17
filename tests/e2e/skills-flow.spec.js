import { test, expect } from '@playwright/test';

test.describe('Milestone M1.4: Skills Creation & Dashboard Browser Flows', () => {
  test('Create skill via template and view in library across viewports', async ({
    page,
  }, testInfo) => {
    const projSlug = testInfo.project.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = Math.floor(Math.random() * 10000);
    const testHandle = `sk-${projSlug}-${rand}`.slice(0, 20);
    const testEmail = `${testHandle}@skillvault.local`;
    const testName = `Creator ${testInfo.project.name}`;
    const testPassword = 'SecurePassword123!';

    // 1. Register a test user
    await page.goto('/register');
    await page.fill('#name', testName);
    await page.fill('#handle', testHandle);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Thư viện của tôi');

    // 2. Navigate to /skills/new
    await page.goto('/skills/new');
    await expect(page.locator('h1')).toContainText('Thêm Agent Skill mới');

    // 3. Select 'Tạo từ mẫu trống' tab
    await page.click('button:has-text("Tạo từ mẫu trống")');

    const skillName = `agent-skill-${rand}`;
    const skillDesc = `Mô tả kỹ năng kiểm tra tự động cho ${testInfo.project.name}`;

    await page.fill('#templateName', skillName);
    await page.fill('#templateDescription', skillDesc);
    await page.fill('#tags', 'e2e, testing, automation');
    await page.selectOption('#visibility', 'PUBLIC');

    // 4. Submit form
    await page.click('button[type="submit"]:has-text("Tạo kỹ năng")');

    // 5. Verify redirect to /dashboard and presence of the created skill card
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Thư viện của tôi');
    await expect(page.locator('body')).toContainText(skillName);
    await expect(page.locator('body')).toContainText('Công khai');
    await expect(page.locator('body')).toContainText('#e2e');
  });
});
