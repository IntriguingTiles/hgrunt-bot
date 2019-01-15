const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const translate = require("../utils/translate.js");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "nogf",
    usage: "nogf",
    info: "Jon is a broken man"
};

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["igmg"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();

    if (args[0]) {
        msg.channel.send({ files: ["./nogf.png"]});
        msg.channel.stopTyping();
        return;
    }

    const html = (await snekfetch.get("http://garfield.zweistein.cz/")).body;
    if (!html) {
        msg.channel.send(await translate("Failed to get comic!"));
        msg.channel.stopTyping();
    }

    const $ = cheerio.load(html);
    const img = "http://garfield.zweistein.cz/" + $("img").first().attr("src");

    msg.channel.send({ files: [img] });
    msg.channel.stopTyping();
};