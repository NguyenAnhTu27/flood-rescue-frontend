import { test, expect } from '@playwright/test';

const routes = [
    '/',
    '/huong-dan-khan-cap',
    '/lien-he-ho-tro',
    '/tuyen-bo-mien-tru-trach-nhiem',
    '/chinh-sach-bao-mat',
    '/dang-nhap',
    '/dang-ky',
    '/admin/noi-dung-trang',
];

const breakpoints = [
    { name: 'mobile-375', width: 375, height: 812 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 1024 },
];

for (const route of routes) {
    for (const viewport of breakpoints) {
        test(`visual ${route} @ ${viewport.name}`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);
            await expect(page).toHaveScreenshot(
                `${route.replaceAll('/', '_') || '_home'}-${viewport.name}.png`,
                { fullPage: true }
            );
        });
    }
}
