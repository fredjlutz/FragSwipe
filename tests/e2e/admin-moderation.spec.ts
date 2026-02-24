import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Admin UI Moderation Dashboard Flow
 */
test('Admin user can view and reject prohibited listings', async ({ page }) => {
    // 1. Authenticate explicitly as admin account
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@fragswipe.co.za');
    await page.fill('input[type="password"]', 'secure-admin-pass');
    await page.click('button:has-text("Sign In")');

    await page.waitForNavigation();

    // 2. Head to built-in admin panel or restricted paths.
    // Supposing `/admin` exists or moderation queue for these tests based on previous routing
    await page.goto('http://localhost:3000/admin/moderation');

    // 3. We look for a pending listing row generated in seed containing a blocked keyword
    // E.g 'Shark' or 'Triggerfish'

    const flagRow = page.locator('tr:has-text("Shark")');
    await expect(flagRow).toBeVisible();

    // Admin clicks 'Reject' logic button attached to that row manually
    const rejectBtn = flagRow.locator('button:has-text("Reject")');
    await rejectBtn.click();

    // Status visual should update instantly / fade away
    await expect(page.locator('text=Listing Rejected Successfully')).toBeVisible();
    await expect(flagRow).not.toBeVisible();
});
