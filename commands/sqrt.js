const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "sqrt",
    usage: "sqrt [latest] [YYYY-MM-DD]",
    info: "Square Root of Minus Garfield"
};

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["sromg"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();

    let url = "http://www.mezzacotta.net";

    if (args.length === 0) {
        url += "/garfield/?comic=0"; // 0 -> random
        sendComic(url, msg);
    } else if (args[0].startsWith("l")) {
        url += "/garfield/"; // no args -> latest
        sendComic(url, msg);
    } else {
        const html = (await snekfetch.get("http://www.mezzacotta.net/garfield/archive.php")).body;
        const $ = cheerio.load(html);
        const comic = $("a").filter(function () { return $(this).text().trim() === args[0]; }).first().attr("href"); //eslint-disable-line brace-style

        if (!comic) {
            msg.channel.send("No comic was found for `" + args[0] + "` - check the date format (YYYY-MM-DD)");
            msg.channel.stopTyping();
            return;
        }

        url += comic;
        sendComic(url, msg);
    }
};

async function sendComic(url, msg) {
    const html = (await snekfetch.get(url)).body;
    if (!html) {
        msg.channel.send("Failed to get comic!");
        msg.channel.stopTyping();
    }

    const $ = cheerio.load(html);
    const img = "http://www.mezzacotta.net/" + $("img").eq(1).attr("src");

    msg.channel.send({ files: [img] });
    msg.channel.stopTyping();
}
