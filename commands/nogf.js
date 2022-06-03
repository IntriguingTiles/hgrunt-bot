const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
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
    msg.channel.sendTyping();

    if (args[0]) {
        msg.channel.send({ files: ["./nogf.png"] });
        return;
    }

    const html = (await snekfetch.get("http://garfield.zweistein.cz/")).body;
    if (!html) {
        msg.channel.send("Failed to get comic!");
        return;
    }

    const $ = cheerio.load(html);
    const img = "http://garfield.zweistein.cz/" + $("img").first().attr("src");

    msg.channel.send({ files: [img] });
};