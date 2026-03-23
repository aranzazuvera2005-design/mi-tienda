const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

async function scrapeEtsy() {
    console.log("🚀 Iniciando scraping con Puppeteer Stealth...");

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=es-ES', '--disable-blink-features=AutomationControlled']
    });

    const products = [];

    try {
        for (let page = 1; page <= 5 && products.length < 100; page++) {
            const tab = await browser.newPage();

            await tab.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            );
            await tab.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });

            const url = `https://www.etsy.com/shop/BabyTatiSewingShop?page=${page}`;
            console.log(`📄 Cargando página ${page}: ${url}`);

            await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            const items = await tab.evaluate(() => {
                const results = [];

                // Selector principal de tarjetas de producto
                const cards = document.querySelectorAll('div[data-listing-id]');

                cards.forEach(card => {
                    const listingId = card.getAttribute('data-listing-id');
                    const nameEl = card.querySelector('h3') || card.querySelector('[class*="title"]');
                    const priceEl = card.querySelector('.currency-value') || card.querySelector('[class*="price"]');
                    const imgEl = card.querySelector('img');
                    const linkEl = card.querySelector('a[href*="/listing/"]');

                    const name = nameEl ? nameEl.textContent.trim() : null;
                    const priceText = priceEl ? priceEl.textContent.trim().replace(',', '.') : null;
                    let image = imgEl ? (imgEl.dataset.src || imgEl.src) : null;

                    if (image) {
                        image = image.replace(/il_\d+x\d+/, 'il_680x540');
                    }

                    const link = linkEl ? linkEl.href : null;

                    if (name && priceText && listingId) {
                        results.push({
                            id: listingId,
                            name,
                            price: parseFloat(priceText) || 0,
                            image,
                            link,
                            category: "Handmade"
                        });
                    }
                });

                return results;
            });

            console.log(`  ✅ Encontrados ${items.length} productos en página ${page}`);

            // Reasignar IDs correlativos
            items.forEach(item => {
                if (!products.find(p => p.id === item.id)) {
                    products.push({ ...item, id: products.length + 1 });
                }
            });

            await tab.close();

            if (items.length === 0) break;
            await new Promise(r => setTimeout(r, 2000));
        }
    } finally {
        await browser.close();
    }

    const output = products.slice(0, 100);
    const dir = './public/data';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/products.json`, JSON.stringify(output, null, 2));

    console.log(`\n🎉 Guardados ${output.length} productos en public/data/products.json`);

    if (output.length === 0) {
        console.log("⚠️  Etsy bloqueó el acceso. Intenta con stealth plugin o con cookies reales.");
        process.exit(1);
    }
}

scrapeEtsy().catch(e => {
    console.error("❌ Error:", e.message);
    process.exit(1);
});
