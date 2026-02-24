import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Subscription Tier Quota UI Behavior
 */
test('Free user gets blocked when attempting to exceed tier quota', async ({ page }) => {
    // 1. Authenticate with a Free Tier account that we've purposefully over-seeded 
    // to have 3 listings active in the database directly. 
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'free-maxed@fragswipe.co.za');
    await page.fill('input[type="password"]', 'secure-password');
    await page.click('button:has-text("Sign In")');

    await page.waitForNavigation();

    // 2. Go to creation route attempting the 4th listing
    await page.goto('http://localhost:3000/sell/new');

    // MOCK FILE UPLOAD progress
    await page.click('button:has-text("Next")');

    // Fill valid schema text inputs naturally
    await page.fill('input[name="title"]', 'Over The Limit Frag');
    await page.selectOption('select[name="category"]', 'coral_sps');
    await page.fill('textarea[name="description"]', 'Trying to breach 3 items.');
    await page.fill('input[name="price"]', '100');
    await page.click('button:has-text("Next")');

    // Submit Network request for creation
    await page.click('button:has-text("Publish Listing")');

    // Expect an API block and Toast UI warning rendering the limits explicitly
    await expect(page.locator('text=Upgrade your plan to add more listings')).toBeVisible();

    // Verify user is structurally redirected/encouraged to Upgrade Pro view
    await expect(page.locator('a[href*="/upgrade"]')).toBeVisible();
});
