import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Verify Swipe to Favourite Flow
 */
test('User can browse discover feed and swipe right to favorite', async ({ page }) => {
    // 1. Navigate & Authenticate
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'buyer@fragswipe.co.za');
    await page.fill('input[type="password"]', 'secure-password');
    await page.click('button:has-text("Sign In")');

    await page.waitForNavigation();

    // 2. Dashboard - We assume seed data populated some coral chunks
    await expect(page).toHaveURL(/.*\/discover/);

    // Test the buttons. We expect the current card to have a title rendered
    // Wait for the first actual swipe card title to appear
    const firstListing = page.locator('h2').first();
    const titleText = await firstListing.innerText();

    // Hit the heart symbol manually
    const heartBtn = page.locator('button').filter({ hasText: '' }).nth(2); // Since WhatsApp is a link, heart is the rightmost button
    await heartBtn.click();

    // 3. Navigate to Favorites page
    await page.click('text=Favorites');
    await expect(page).toHaveURL(/.*\/favorites/);

    // 4. Validate that the previously right-swiped card appears here mapping logic
    await expect(page.locator(`text=${titleText}`)).toBeVisible();
});
