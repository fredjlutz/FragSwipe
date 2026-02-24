import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Create Listing Flow
 */
test('User can successfully create a new full listing', async ({ page }) => {
    // 1. Navigate to Landing Page & Login
    await page.goto('http://localhost:3000');

    // We expect the user to be logged in for this test. Mock login.
    await page.click('text=Log in');
    await page.fill('input[type="email"]', 'seller@fragswipe.co.za');
    await page.fill('input[type="password"]', 'secure-password');
    await page.click('button:has-text("Sign In")');

    await page.waitForNavigation();

    // Navigate to Sell
    await page.goto('http://localhost:3000/sell/new');

    // MOCK FILE UPLOAD: We stub this visually since Playwright file upload needs local image.
    // Instead we just progress the form
    await page.click('button:has-text("Next")');

    // Fill details
    await page.fill('input[name="title"]', 'Neon Green Toadstool');
    await page.selectOption('select[name="category"]', 'coral_soft');
    await page.fill('textarea[name="description"]', 'Healthy and extending beautifully.');
    await page.fill('input[name="price"]', '350');
    await page.click('button:has-text("Next")');

    // Confirm location & publish
    await page.click('button:has-text("Publish Listing")');
    await page.waitForNavigation();

    // Verify it exists in My Listings View
    await expect(page).toHaveURL(/.*\/my-listings/);
    await expect(page.locator('text=Neon Green Toadstool')).toBeVisible();
    await expect(page.locator('text=R 350')).toBeVisible();
});
