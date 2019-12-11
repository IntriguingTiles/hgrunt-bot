const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const Entities = require("html-entities").XmlEntities;

const entities = new Entities();

module.exports = async text => {
    const r = await snekfetch.post("http://www.yodaspeak.co.uk/index.php").set("Content-Type", "application/x-www-form-urlencoded").set("Referer", "http://www.yodaspeak.co.uk/").attach("YodaMe", entities.encode(text));

const $ = cheerio.load(r.body);
    return entities.decode($("textarea[name='YodaSpeak']").text());
};