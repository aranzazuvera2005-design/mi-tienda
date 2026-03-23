const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--lang=es-ES']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto('https://www.etsy.com/shop/BabyTatiSewingShop', { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));

    const title = await page.title();
    const bodySnippet = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
    const allListingIds = await page.evaluate(() => {
        return [...document.querySelectorAll('[data-listing-id]')].map(el => el.getAttribute('data-listing-id'));
    });

    console.log("TITLE:", title);
    console.log("LISTING IDs:", allListingIds);
    console.log("BODY SNIPPET:", bodySnippet.replace(/<[^>]+>/g, ' ').slice(0, 500));

    await page.screenshot({ path: 'etsy-debug.png', fullPage: false });
    console.log("Screenshot guardado en etsy-debug.png");
    await browser.close();
})();
