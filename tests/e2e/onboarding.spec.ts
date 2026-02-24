import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Primary User Journey
 * Tests the happy path of a new user signing up, onboarding their profile,
 * and creating their first listing successfully.
 */
test('User can login, onboard, and post a listing', async ({ page }) => {

    // 1. Navigate to Landing Page
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/FragSwipe/);

    // 2. Click Login
    await page.click('text=Log in');
    await expect(page).toHaveURL(/.*\/login/);

    // 3. Authenticate (Mocking standard Supabase Magic Link / Test User behavior)
    // Normally, this requires intercepting the Supabase auth callback or using an explicit test account.
    await page.fill('input[type="email"]', 'e2e-tester@fragswipe.co.za');
    await page.fill('input[type="password"]', 'secure-test-password-123!');
    await page.click('button:has-text("Sign In")');

    // Wait for auth redirect
    await page.waitForNavigation();

    // 4. Onboarding (If new user, they hit /onboarding)
    if (page.url().includes('/onboarding')) {
        await page.fill('input[name="fullName"]', 'Playwright Tester');
        await page.fill('input[name="whatsappNumber"]', '+27821112222');

        // Note: the Geocoding API address logic uses external calls
        await page.fill('input[name="address"]', 'Camps Bay, Cape Town');
        await page.click('button:has-text("Complete Profile")');
        await page.waitForNavigation();
    }

    // 5. Discover Dashboard Landing
    await expect(page).toHaveURL(/.*\/discover/);

    // 6. Navigate to Sell
    await page.click('a[href="/sell/new"]');
    await expect(page).toHaveURL(/.*\/sell\/new/);

    // 7. Create Listing Form (Multipart)
    // Step 1: Photos (Playwright file upload mockup)
    // In actual env, point to a sample picture: await page.setInputFiles('input[type="file"]', 'tests/fixtures/coral.jpg');
    await page.click('button:has-text("Next")');

    // Step 2: Details
    await page.fill('input[name="title"]', 'E2E Test SPS Frag');
    await page.selectOption('select[name="category"]', 'coral_sps');
    await page.fill('textarea[name="description"]', 'This is an automated test listing ensuring the DB logic parses correctly.');
    await page.fill('input[name="price"]', '550');
    await page.click('button:has-text("Next")');

    // Step 3: Location (Defaults to profile location)
    await page.click('button:has-text("Publish Listing")');

    // 8. Assert successful publication and redirect to My Listings
    await page.waitForNavigation();
    await expect(page).toHaveURL(/.*\/my-listings/);

    // Check that the listing appears visually on the Management board
    await expect(page.locator('text=E2E Test SPS Frag')).toBeVisible();
    await expect(page.locator('text=R 550')).toBeVisible();
});
