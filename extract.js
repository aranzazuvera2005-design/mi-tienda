const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrape() {
    console.log("Extrayendo productos...");
    const products = [];
    // Escaneamos las primeras 3 páginas para asegurar 100 productos
    for(let p=1; p<=3; p++) {
        const { data } = await axios.get(`https://www.etsy.com/es/shop/BabyTatiSewingShop?ref=shop_sugg_market&page=${p}`);
        const $ = cheerio.load(data);
        $('.listing-link').each((i, el) => {
            products.push({
                id: products.length + 1,
                name: $(el).find('.wt-text-caption').text().trim(),
                price: $(el).find('.currency-value').first().text(),
                image: $(el).find('img').attr('src')?.replace('il_340x270', 'il_680x540'),
                category: "Handmade"
            });
        });
    }
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/products.json', JSON.stringify(products.slice(0, 100), null, 2));
    console.log("✅ ¡100 Productos guardados en data/products.json!");
}
scrape();