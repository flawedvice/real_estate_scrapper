const fs = require('fs');

async function getDetailLinks(page, url) {
    
    await page.goto(url);
    
    // Create write stream
    const date = new Date().toISOString();

    let next = page.getByText('Siguiente');
    let pageResults = page.locator('li.ui-search-layout__item');
    let links = [];
    let count = 0;
    do {
        for (const result of await pageResults.all()) {
            console.log("Getting link n° "+(++count));
            links.push(await result.locator('div.ui-search-result__content').first().getByRole('link').getAttribute('href'));
        }
        await next.click();
        try {
            if (await page.getByRole('button', {name: 'Siguiente'}).isVisible())
            {
                next = await page.getByRole('button', {name: 'Siguiente'});
            }
            else {
                console.log("No more items left.\nExiting.");
                break;
            }
        }
        catch(err) {
            console.log("No more items left.\nExiting.");
            break;
        }

    } while(next.isVisible()) 
    
    console.log("Saving data into file...");

    const fileName = './links-'+date+'.json';
    const stream = fs.createWriteStream(fileName, { flags: 'w' });

    const json = JSON.stringify(links);

    stream.write(json);
    stream.close();
    
    console.log("Got "+links.length+" links!");
    return fileName;
}

async function exploreLink(page, url) {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    const currency = await page.locator("#price").locator(".andes-money-amount__currency-symbol").first().allTextContents()[0];
    console.log(currency);
    
    /*
    const price = await page.locator("#price").locator(".andes-money-amount__fraction").first().allTextContents()[0];

    const dimensions = await page.getByText("m² totales").allTextContents()[0];

    const location = (await page.locator("#location").allTextContents())[1];


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
        price, currency, dimensions, location, //attributes
    }

    console.log(results);
    return results;
    */
    
}

module.exports = {
    getDetailLinks,
    exploreLink
}