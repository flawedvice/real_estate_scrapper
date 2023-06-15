const playwright = require('playwright');
const fs = require('fs');
const { getDetailLinks, exploreLink } = require('./scrappers.js');

const links = require('./links.json');



const type = 'parcelas';
const operation = 'venta';
const town = 'frutillar';
const region = 'los-lagos';

const url = `https://listado.mercadolibre.cl/inmuebles/${type}/${operation}/${region}/${town}/`;

const pageGenerator = async (headless = false) => {
    const browser = await playwright.firefox.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    return {page, browser};
};

async function getLinks(page, count = 0) {
    const results = page.locator('li.ui-search-layout__item');
    
    const stream = fs.createWriteStream('./links.txt', { flags: 'a' });
    for (const result of await results.all()) {
        const link = await result.locator('div.ui-search-result__content').first().getByRole('link').getAttribute('href');
        
        count++;

        stream.write(link+" \n");
    }
    stream.close();
}

async function homeSearch(page) {

    await page.goto(url);
    
    let next = page.getByText('Siguiente');
    let count = 0;
    while(next.isVisible()) {
        await getLinks(page, count);
        await next.click();
        next = page.getByText('Siguiente');
    }
    /*
    for (let i = 0; i < 10; i++) {
        if (!next.isVisible()) break;
        await getLinks(page, count);
        await next.click();
        next = page.getByText('Siguiente');
    }
    */
    console.log(count);
    
    // Wait 10 seconds (or 10,000 milliseconds)
    await page.waitForTimeout(10000);

    // Close the browser
    await browser.close();
}

async function getInfo(link, page = null) {
    let newPage;
    if (!page) {
        newPage = (await pageGenerator()).page;
        page = newPage;
    }

    await page.goto(link);

    await page.waitForLoadState('domcontentloaded');

    const currency = await page.locator("#price").locator(".andes-money-amount__currency-symbol").first().allTextContents();
    const price = await page.locator("#price").locator(".andes-money-amount__fraction").first().allTextContents();

    let dimensions = await page.getByText("m² totales").allTextContents();

    let location = await page.locator("#location").getByLabel("p").first().allTextContents();

    const table = page.getByRole("table").first();
    let tableVisible = false;
    await table.waitFor({timeout: 3000}).then(() => tableVisible = true).catch(err => tableVisible = false).finally(() => console.log("Evaluated. Table is visible: ", tableVisible));

    console.log("attrs");
    const attributes = [];
    if (tableVisible) {
        console.log("Confirming table is visible");
        const trows = table.getByLabel("tr");
        
        console.log("First row: ", await trows.first().allTextContents());

        let attr = { name: '', value: ''};
        for (const tr of await trows.all()) {
            let th = await tr.getByLabel("th").allTextContents();
            let td = await tr.getByLabel("td").allTextContents();
            console.log(th, td);
            attr.name = await tr.getByLabel("th").allTextContents();
            attr.value = await tr.getByLabel("td").allTextContents();
            attributes.push(attr);
        }
    }

    const results = {
        price, currency, dimensions, location, attributes
    }

    console.log(results);
    return results;
    /**
     * Get:
     * - valor
     * - divisa (UF o CLP)
     * - ubicación
     * - antigüedad
     * - m² totales
     * - dormitorios
     * - baños
     */
}

const finalWrite = async () => {

    const result = [];
    const {page, browser} = await pageGenerator();
    for (const link of links) {
        result.push(await getInfo(link, page))
        console.log(link);
    }
    const json = JSON.stringify(result);
    
    const stream = fs.createWriteStream('./results.json', {flags: 'w'});
    
    stream.write(json);
    
    stream.close();
    
    await browser.close();
}

async function main() {

    /*
    const { page, browser } = await pageGenerator(true);
    const fileName = await getDetailLinks(page, url);
    await browser.close();
    const json = require(fileName);
    */
   
   
    const json = require('./links-2023-06-14T20:56:38.968Z.json');

    const { page, browser } = await pageGenerator();
    await exploreLink(page, json[1]);

    return;
}

main();