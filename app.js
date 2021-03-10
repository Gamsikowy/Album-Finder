const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/funcionality'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));

// search with puppeteer
app.post('/searching', (req, res) => {
    let author = req.body.author;
    let searchTitle = req.body.title.trim();
    let albumName;
    let running = true;
    let cover = undefined;
    let albumURL = undefined;
    let result = `There is no ${author[0].toUpperCase() + author.slice(1)}'s song with the title: ${searchTitle}.`;

    (async () => {
        const browser = await puppeteer.launch({ headless: true, timeout: 0});
        const page = await browser.newPage();
        const navigationPromise = page.waitForNavigation({ waitUntil: 'load', timeout: 0 });

        process.on("uncaughtException", () => console.log(`I crashed`));
        process.on("unhandledRejection", () => console.log(`I was rejected`));
        page.on('dialog', async dialog => {
                console.log(dialog.message());
                await dialog.dismiss();
              });

        try {
            await page.goto(`https://genius.com/artists/${author}`);
            await navigationPromise;

            await new Promise(r => setTimeout(r, 1000));

            if (await page.$('#onetrust-button-group-parent #onetrust-button-group #onetrust-accept-btn-handler', { timeout: 500 })) {
                await page.waitForSelector('#onetrust-button-group-parent #onetrust-button-group #onetrust-accept-btn-handler', { timeout: 0 });
                await page.click('#onetrust-button-group-parent #onetrust-button-group #onetrust-accept-btn-handler');
                console.log('Popup is closed');
            }

            await new Promise(r => setTimeout(r, 1000));
            await navigationPromise;
            await page.waitForSelector('.full_width_button.u-clickable.u-quarter_top_margin');
            await page.click('.full_width_button.u-clickable.u-quarter_top_margin');

            await navigationPromise;
            await page.waitForSelector('.u-display_block div mini-album-card a', { timeout: 0 });
            const albumLinks = await page.$$eval('.u-display_block div mini-album-card a', as => as.map(a => a.href));
            
            for (let albumLink of albumLinks) {
                const searchingPage = await browser.newPage();
                const searchNavigationPromise = searchingPage.waitForNavigation({ waitUntil: 'load', timeout: 0 });
                await searchingPage.goto(albumLink);
                await searchNavigationPromise;

                await searchingPage.waitForSelector('.header_with_cover_art-primary_info h1');
                albumName = await searchingPage.$('.header_with_cover_art-primary_info h1');
                const albumNameText = await (await albumName.getProperty('textContent')).jsonValue();
                
                await searchingPage.waitForSelector('.chart_row-content-title');
                const titles = await searchingPage.$$eval('.chart_row-content-title', hs => hs.map(h => h.textContent));
                
                for (let title of titles) {
                    title = title.trim().toLowerCase().slice(0, -6);
                   
                    if (title.includes((searchTitle.toLowerCase()))) {
                        result = `The album you are looking for is ${albumNameText}.`;
                        await searchingPage.waitForSelector('.cover_art-image');
                        cover = await searchingPage.$eval('.cover_art-image', c => c.src);
                        albumURL = searchingPage.url();
                        running = false;
                    }
                }
                searchingPage.close();
                if (!running) break;
            }
    } catch (err) {
            console.error(err);
        } 

        console.log(result);
        console.log(cover);
        console.log(albumURL);

        await page.close();
        await browser.close();

        res.json({
            status: 'successful',
            result: result,
            cover: cover,
            albumURL: albumURL
        })
    })()
});
