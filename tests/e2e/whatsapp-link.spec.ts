import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Contact Seller Flow via WhatsApp
 */
test('User can open WhatsApp URL with prefilled URL text', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'buyer@fragswipe.co.za');
    await page.fill('input[type="password"]', 'secure-password');
    await page.click('button:has-text("Sign In")');

    await page.waitForNavigation();

    // We expect the discover dashboard to display listings with contact elements
    await expect(page).toHaveURL(/.*\/discover/);

    // Check for anchor elements linking externally to wa.me
    // Since Playwright runs in headless mode, we check DOM attributes
    // instead of following the actual WhatsApp external redirect since wa.me fails to load in CI properly

    const whatsappLink = page.locator('a[href*="wa.me"]').first();

    // Verify visibility and structurally correct link formulation
    await expect(whatsappLink).toBeVisible();

    const href = await whatsappLink.getAttribute('href');
    expect(href).toContain('https://wa.me/');

    // Verify URL text encoding parameter for FragSwipe automated entry message exists
    expect(href).toContain('%20FragSwipe');
});
