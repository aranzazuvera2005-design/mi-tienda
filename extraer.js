const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function obtenerProductos() {
    // Usamos la URL directa de los artículos de la tienda
    const urlBase = "https://www.etsy.com/es/shop/BabyTatiSewingShop/items?ref=pagination&page=";
    let todosLosProductos = [];

    console.log("🚀 Reintentando extracción con modo incógnito...");

    for (let i = 1; i <= 3; i++) {
        try {
            const { data } = await axios.get(urlBase + i, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'es-ES,es;q=0.9',
                    'Referer': 'https://www.google.com/'
                }
            });
            const $ = cheerio.load(data);

            // Selector específico para los productos de Etsy
            $('div[data-listing-id]').each((index, element) => {
                const nombre = $(element).find('h3').text().trim();
                const precio = $(element).find('.currency-value').first().text();
                let imagen = $(element).find('img').attr('src');
                
                // Si la imagen existe, la mejoramos a alta resolución
                if (imagen) imagen = imagen.replace('il_340x270', 'il_680x540');

                if (nombre && precio) {
                    todosLosProductos.push({
                        id: todosLosProductos.length + 1,
                        name: nombre,
                        price: parseFloat(precio.replace(',', '.')),
                        image: imagen,
                        category: "Handmade"
                    });
                }
            });
            console.log(`✅ Página ${i}: ${todosLosProductos.length} productos acumulados...`);
            
            // Esperamos 2 segundos entre páginas para que no nos bloqueen
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (e) {
            console.log(`❌ Error en página ${i}: Posible bloqueo de Etsy.`);
        }
    }

    const dir = './public/data';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(`${dir}/products.json`, JSON.stringify(todosLosProductos, null, 2));
    console.log(`\n🎉 ¡TERMINADO! Se han guardado ${todosLosProductos.length} productos reales.`);
}

obtenerProductos();