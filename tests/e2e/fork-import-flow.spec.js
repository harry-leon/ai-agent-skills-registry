import { test, expect } from '@playwright/test';

test.describe('Milestone M1.6: Fork and GitHub Import End-to-End Flows', () => {
  test('Fork a public skill between users and import repository from GitHub', async ({
    page,
    context,
  }, testInfo) => {
    const randA = Math.floor(100000 + Math.random() * 900000);
    const randB = Math.floor(100000 + Math.random() * 900000);
    const handleA = `usra${randA}`;
    const emailA = `${handleA}@skillvault.local`;
    const password = 'Password123!';
    const nameA = `User Alpha ${testInfo.project.name}`;

    const handleB = `usrb${randB}`;
    const emailB = `${handleB}@skillvault.local`;
    const nameB = `User Beta ${testInfo.project.name}`;

    // 1. User A registers
    await page.goto('/register');
    await page.fill('#name', nameA);
    await page.fill('#handle', handleA);
    await page.fill('#email', emailA);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 60000 });
    await expect(page.locator('h1')).toContainText('My Skills');

    // 2. User A creates a public skill from template
    await page.goto('/skills/new');
    await page.click('button:has-text("Blank Template")');

    const skillName = `source-skill-${randA}`;
    const skillDesc = `Original skill description for ${testInfo.project.name}`;

    await page.fill('#templateName', skillName);
    await page.fill('#templateDescription', skillDesc);
    await page.fill('#tags', 'original, public, shared');
    await page.selectOption('#visibility', 'PUBLIC');

    await page.click('button[type="submit"]:has-text("Create Skill")');
    await page.waitForURL('**/dashboard', { timeout: 60000 });

    const sourceCard = page.locator(`a:has-text("${skillName}")`).first();
    await expect(sourceCard).toBeVisible({ timeout: 10000 });
    const sourceSkillHref = await sourceCard.getAttribute('href');

    // 3. User A logs out (clear cookies)
    await context.clearCookies();

    // 4. User B registers
    await page.goto('/register');
    await page.fill('#name', nameB);
    await page.fill('#handle', handleB);
    await page.fill('#email', emailB);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 60000 });

    // 5. User B visits User A's public skill page
    await page.goto(sourceSkillHref);
    await expect(page.locator('h1').first()).toContainText(skillName);
    await expect(page.locator('main').locator(`text=@${handleA}`).first()).toBeVisible();

    // 6. User B clicks "Fork" button
    const forkBtn = page.locator('button:has-text("Fork")').first();
    await expect(forkBtn).toBeVisible();
    await forkBtn.click();

    // 7. Verify redirection to User B's new fork
    await page.waitForURL(new RegExp(`/s/${handleB}/`), { timeout: 60000 });
    await expect(page.locator('h1').first()).toContainText(skillName);
    await expect(page.locator('main').locator(`text=@${handleB}`).first()).toBeVisible();

    // 8. Verify attribution badge "Forked from @handleA/slug"
    const attributionBadge = page.locator('main').locator('text=Forked from').first();
    await expect(attributionBadge).toBeVisible();
    await expect(
      page.locator('main').locator(`text=@${handleA}/${skillName}`).first(),
    ).toBeVisible();

    // 9. Verify fork appears in User B's dashboard with attribution badge
    await page.goto('/dashboard');
    await expect(
      page.locator('main').locator(`text=@${handleA}/${skillName}`).first(),
    ).toBeVisible();

    // 10. Test GitHub Import UI Page
    await page.goto('/import');
    await expect(page.locator('h1')).toContainText('Import Skill from GitHub');

    // Mock API response for GitHub import endpoint
    await page.route('**/api/imports/github', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            skill: {
              id: 'imported-e2e-id',
              slug: 'imported-github-agent',
              name: 'imported-github-agent',
              owner: { handle: handleB },
              sourceUrl: 'https://github.com/octocat/Hello-World',
              sourceCommit: '7fd1a60',
            },
            validation: { warnings: [] },
          },
        }),
      });
    });

    // Fill GitHub URL and submit
    await page.fill('#githubUrl', 'https://github.com/octocat/Hello-World');
    await page.fill('#tags', 'imported, octocat');
    await page.selectOption('#visibility', 'PUBLIC');

    const importSubmitBtn = page.locator('button[type="submit"]:has-text("Import Skill")');
    await expect(importSubmitBtn).toBeVisible();
    await importSubmitBtn.click();

    // Verify redirect to the imported skill viewer
    await page.waitForURL(new RegExp(`/s/${handleB}/imported-github-agent`), { timeout: 15000 });
  });
});
