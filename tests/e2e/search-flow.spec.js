import { test, expect } from '@playwright/test';

test.describe('Milestone M1.7: Search and Library Discovery End-to-End Flows', () => {
  test('Search public skills on Explore and manage library filters on Dashboard', async ({
    page,
    context,
  }, testInfo) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const handle = `srchu${rand}`;
    const email = `${handle}@skillvault.local`;
    const password = 'Password123!';
    const name = `Search User ${testInfo.project.name}`;

    // 1. User registers
    await page.goto('/register');
    await page.fill('#name', name);
    await page.fill('#handle', handle);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Thư viện của tôi');

    // 2. Create Skill 1 (Public) with Vietnamese content
    const publicSkillName = `tk-public-${rand}`;
    const publicSkillDesc = `Hệ thống tìm kiếm thông minh đa ngôn ngữ ${testInfo.project.name}`;

    await page.goto('/skills/new');
    await page.click('button:has-text("Tạo từ mẫu trống")');
    await page.fill('#templateName', publicSkillName);
    await page.fill('#templateDescription', publicSkillDesc);
    await page.fill('#tags', 'nlp, vietnamese, smartsearch');
    await page.selectOption('#visibility', 'PUBLIC');
    await page.click('button[type="submit"]:has-text("Tạo kỹ năng")');
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // 3. Create Skill 2 (Private)
    const privateSkillName = `nb-private-${rand}`;
    const privateSkillDesc = `Dự án nội bộ tuyệt mật của ${handle}`;

    await page.goto('/skills/new');
    await page.click('button:has-text("Tạo từ mẫu trống")');
    await page.fill('#templateName', privateSkillName);
    await page.fill('#templateDescription', privateSkillDesc);
    await page.fill('#tags', 'internal, secret');
    await page.selectOption('#visibility', 'PRIVATE');
    await page.click('button[type="submit"]:has-text("Tạo kỹ năng")');
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify both skills are present initially in Dashboard
    await expect(page.locator(`text=${publicSkillName}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${privateSkillName}`).first()).toBeVisible({ timeout: 10000 });

    // 4. Test Dashboard Search & Filter
    // 4a. Search for public skill name
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    await searchInput.fill(publicSkillName);
    const searchResp1 = page.waitForResponse(
      (r) => r.url().includes('/api/me/skills') && r.status() === 200,
    );
    await page.click('button:has-text("Tìm")');
    await searchResp1;

    await expect(page.locator(`text=${publicSkillName}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${privateSkillName}`)).not.toBeVisible();

    // 4b. Clear search and filter by PRIVATE visibility
    await searchInput.fill('');
    const clearResp = page.waitForResponse(
      (r) => r.url().includes('/api/me/skills') && r.status() === 200,
    );
    await page.click('button:has-text("Tìm")');
    await clearResp;

    const visSelect = page.locator('select').first();
    const privResp = page.waitForResponse(
      (r) => r.url().includes('/api/me/skills') && r.status() === 200,
    );
    await visSelect.selectOption('PRIVATE');
    await privResp;

    await expect(page.locator(`text=${privateSkillName}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${publicSkillName}`)).not.toBeVisible();

    // 4c. Reset visibility to all
    const allResp = page.waitForResponse(
      (r) => r.url().includes('/api/me/skills') && r.status() === 200,
    );
    await visSelect.selectOption('');
    await allResp;

    await expect(page.locator(`text=${publicSkillName}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${privateSkillName}`).first()).toBeVisible({ timeout: 10000 });

    // 5. Test Anonymous Public Search on /explore
    await context.clearCookies();
    await page.goto('/explore');

    // Guest should see Explore header
    await expect(page.locator('h1').first()).toContainText('Khám phá');

    // Public skill MUST be visible
    await expect(page.locator(`text=${publicSkillName}`).first()).toBeVisible({ timeout: 10000 });

    // Private skill MUST NEVER be visible to public (Rule S2)
    await expect(page.locator(`text=${privateSkillName}`)).not.toBeVisible();

    // Search on Explore
    const exploreSearchInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    await exploreSearchInput.fill(publicSkillName);
    const pubSearchResp = page.waitForResponse(
      (r) => r.url().includes('/api/skills') && r.status() === 200,
    );
    await page.click('button:has-text("Tìm")');
    await pubSearchResp;

    await expect(page.locator(`text=${publicSkillName}`).first()).toBeVisible({ timeout: 10000 });

    // Click skill card to navigate to viewer
    await page.locator(`a:has-text("${publicSkillName}")`).first().click();
    await page.waitForURL(`**/s/${handle}/**`, { timeout: 15000 });
    await expect(page.locator('h1').first()).toContainText(publicSkillName);
  });
});
