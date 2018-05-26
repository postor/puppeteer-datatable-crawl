const puppeteer = require('puppeteer');
const fs = require('fs-extra');

const {
  url = 'https://www.google.com',
  name = 'username',
  pass = 'password',
} = fs.exists('config.json') ? require('./config.json') : {};

(async () => {
  const browser = await puppeteer.launch({ devtools: true });
  const page = await browser.newPage();
  await page.goto(url);

  //首先要登录
  await page.type('#edit-name', name, { delay: 20 })
  await page.type('#edit-pass', pass, { delay: 20 })
  await Promise.all([
    page.click("#edit-submit"),
    page.waitForNavigation(),
  ]);

  //开始抓取数据
  let crawledData = []

  //循环每页
  while (true) {
    await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.2.1.min.js' })
    crawledData.push(await page.evaluate(table2json));

    try {
      const nextpage = await page.$(".pager-next a")

      await Promise.all([
        nextpage.click(),
        page.waitForNavigation(),
      ]);
    } catch (e) {
      break
    }
  }
  await fs.writeJson('crawled-data.json', crawledData)
  await browser.close()
})();

function table2json() {
  const $table = $('table')
  const keys = $table.find('th').map(function () {
    return $(this).text().trim();
  }).toArray()
  const rows = $table.find('tr').map(function () {
    return {
      data: $(this).find('td').map(function () {
        return $(this).text().trim();
      }).toArray()
    }
  }).toArray().map((x) => x.data)

  return {
    keys,
    rows,
  }
}