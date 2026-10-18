import { test, expect } from '@playwright/test';

test.describe('Milestone M1.5: Viewer & Editor End-to-End Browser Flows', () => {
  test('View skill, navigate file tree, edit files, save v2, and verify download across viewports', async ({
    page,
  }, testInfo) => {
    const projSlug = testInfo.project.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = Math.floor(Math.random() * 10000);
    const handle = `ed-${projSlug}-${rand}`.slice(0, 20);
    const email = `${handle}@skillvault.local`;
    const password = 'Password123!';
    const name = `Editor ${testInfo.project.name}`;

    // 1. Register new user
    await page.goto('/register');
    await page.fill('#name', name);
    await page.fill('#handle', handle);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');

    // 2. Wait for dashboard redirect
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.locator('h1')).toContainText('Thư viện của tôi');

    // 3. Navigate to /skills/new to create a skill from basic template
    await page.goto('/skills/new');
    await expect(page).toHaveURL('/skills/new');

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

    // 5. Verify redirect to /dashboard and click the skill card
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    const skillLink = page.locator(`a:has-text("${skillName}")`).first();
    await expect(skillLink).toBeVisible({ timeout: 10000 });
    const skillHref = await skillLink.getAttribute('href');
    await page.goto(skillHref);

    // 6. Verify Viewer Page (/s/[handle]/[slug])
    await expect(page).toHaveURL(new RegExp(`/s/${handle}/`), { timeout: 15000 });
    await expect(page.locator('h1').first()).toBeVisible();

    // Verify version badge v1
    const v1Badge = page.locator('text=v1').first();
    await expect(v1Badge).toBeVisible();

    // Verify file tree has SKILL.md
    const skillMdItem = page.locator('div[role="treeitem"]:has-text("SKILL.md")').first();
    await expect(skillMdItem).toBeVisible();

    // Verify preview has rendered content
    const previewContainer = page.locator('.prose').first();
    await expect(previewContainer).toBeVisible();

    // Verify download ZIP button exists
    const downloadZipBtn = page.locator('a:has-text("Tải ZIP")').first();
    await expect(downloadZipBtn).toBeVisible();

    // 7. Click Edit button to enter Editor (/s/[handle]/[slug]/edit)
    const editBtn = page.locator('a:has-text("Chỉnh sửa")').first();
    await expect(editBtn).toBeVisible();
    const editHref = await editBtn.getAttribute('href');
    await page.goto(editHref);

    await expect(page).toHaveURL(new RegExp(`/s/${handle}/.*/edit`), { timeout: 15000 });

    // 8. Editor Actions: Add a new file
    const addFileBtn = page.locator('button:has-text("Thêm tệp")').first();
    await expect(addFileBtn).toBeVisible();
    await addFileBtn.click();

    // In Add File Modal
    const newFilePathInput = page.locator('input[placeholder="scripts/main.py"]').first();
    await expect(newFilePathInput).toBeVisible();
    await newFilePathInput.fill('notes.txt');
    await page.click('button:has-text("Tạo tệp")');

    // Verify new file appears in file tree
    const newFileItem = page.locator('div[role="treeitem"]:has-text("notes.txt")').first();
    await expect(newFileItem).toBeVisible();

    // Fill version message
    const versionMessageInput = page.locator('input[placeholder*="Ghi chú phiên bản"]').first();
    await expect(versionMessageInput).toBeVisible();
    await versionMessageInput.fill('Thêm tài liệu hướng dẫn v2');

    // Save new version
    const saveBtn = page.locator('button:has-text("Lưu phiên bản")').first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 9. Verify redirect back to Viewer with incremented version v2!
    await page.waitForURL(`**/s/${handle}/**`, { timeout: 15000 });
    const v2Badge = page.locator('text=v2').first();
    await expect(v2Badge).toBeVisible({ timeout: 10000 });

    // Verify new file notes.txt is present in viewer file tree
    const notesItem = page.locator('div[role="treeitem"]:has-text("notes.txt")').first();
    await expect(notesItem).toBeVisible();
  });
});
