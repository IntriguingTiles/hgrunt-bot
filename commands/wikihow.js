const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const translate = require("../utils/translate.js");
const { Client, Message, MessageEmbed } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "wikihow",
    usage: "wikihow [search]",
    info: "Gets a random article or searches for an article from wikiHow."
};

exports.requiredPermissions = ["EMBED_LINKS"];

exports.aliases = ["wh"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();
    if (args.length > 0) {
        // use the mediawiki api to search for an article
        const search = encodeURIComponent(args.join(" "));
        const results = (await snekfetch.get(`https://www.wikihow.com/api.php?action=titlesearch&q=${search}&safeSearch=0&format=json`)).body; // gives us json we can work with

        if (!results.data[0]) {
            msg.channel.send(await translate(`No results found for \`${args.join(" ")}\`!`));
            return msg.channel.stopTyping();
        }

        sendArticle(msg, results.data[0].url);
    } else {
        // random
        sendArticle(msg, "https://www.wikihow.com/Special:Randomizer");
    }
};

/**
 * @param {Message} msg 
 * @param {string} article 
 */
async function sendArticle(msg, article) {
    const html = (await snekfetch.get(article)).body;
    const $ = cheerio.load(html);

    // we can get the data we need from things in <head>
    const title = $("meta[property='og:title']").attr("content");
    const url = $("meta[property='og:url']").attr("content");
    const img = $("meta[property='og:image']").attr("content");
    const description = $("meta[property='og:description']").attr("content");

    // time to send it as an embed
    const embed = new MessageEmbed();

    embed.setAuthor("wikiHow", "https://www.wikihow.com/skins/WikiHow/wH-initials_152x152.png");
    embed.setTitle(await translate(title));
    embed.setURL(url);
    embed.setColor(0x93B874);
    embed.setDescription(await translate(description));
    embed.setImage(img);
    msg.channel.send({ embed: embed });
    msg.channel.stopTyping();
}