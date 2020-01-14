const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const Entities = require("html-entities").XmlEntities;

const entities = new Entities();

module.exports = async text => {
    const r = await snekfetch.post("http://www.yodaspeak.co.uk/webservice/yodatalk.php?wsdl").set("Content-Type", "text/xml")
        .send(`<Envelope><Body><yodaTalk><yodaTalkRequest>${entities.encode(text)}</yodaTalkRequest></yodaTalk></Body></Envelope>`);
    const $ = cheerio.load(r.body);

    return entities.decode($("return").text());
};