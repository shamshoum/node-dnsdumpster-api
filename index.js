const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

function parseData(htmlString) {
  const $ = cheerio.load(htmlString);
  const tables = $('tbody');
  // Fetch DNS Servers
  const dns = [];
  const dnsRows = $(tables[0]).children();
  for (let i = 0; i < dnsRows.length; i++) {
    const row = dnsRows[i];
    const dnsServer = $(row).children()[0].children[0].data;
    dns.push(dnsServer);
  }
  // Fetch MX records
  const mx = [];
  const mxRecordsRows = $(tables[1]).children();
  for (let i = 0; i < mxRecordsRows.length; i++) {
    const row = mxRecordsRows[i];
    const mxRecord = $(row).children()[0].children[0].data;
    mx.push(mxRecord);
  }
  // Fetch A Records
  const aRecords = [];
  const aRecordsRows = $(tables[3]).children();
  for (let i = 0; i < aRecordsRows.length; i++) {
    const row = aRecordsRows[i];
    const aRecord = $(row).children()[0].children[0].data;
    aRecords.push(aRecord);
  }
  return { aRecords, dns, mx };
}

function fetchDataFromSite(searchValue) {
  return new Promise(async (resolve, reject) => {
    let afterSubmit = false;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('error', () => {
      console.error('error');
    });
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
    });
    page.on('domcontentloaded', async () => {
      // Check if page results
      const resultsPage = await page.evaluate(() => (document.documentElement.textContent || document.documentElement.innerText
      ).indexOf('Showing results') > -1);
      if (resultsPage) {
        // Go through results
        const tables = await page.evaluate(() => document.querySelectorAll('tbody').length);
        if (tables.length === 0) {
          // No results were found
          reject();
        }
        const content = await page.evaluate(() => document.querySelector('*').outerHTML);
        browser.close();
        const result = parseData(content);
        console.log(result);
        resolve(result);
      }
    });
    await page.goto('https://dnsdumpster.com');

    // Enter input and navigate to result
    await page.evaluate((value) => {
      const element = document.querySelector('input[name=targetip]');
      element.value = value;
      const button = document.querySelector('button[type=submit]');
      afterSubmit = true;
      button.click();
    }, searchValue);
  })
}


module.exports = fetchDataFromSite;
