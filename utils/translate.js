const snekfetch = require("snekfetch");
const cheerio = require("cheerio");

module.exports = async text => {
    const r = await snekfetch.post("http://www.gizoogle.net/textilizer.php").attach("translatetext", text);
    const $ = cheerio.load(r.body);

    return $("textarea").first().text();
};