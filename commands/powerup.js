const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const { Client, Message, Collection } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "powerup",
    usage: "powerup [search]",
    info: "Gets a random Powerup comic or searches for a Powerup comic."
};

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["pu"];

const comicList = new Collection();

fillComicList();

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();
    if (args.length === 0) {
        // random comic
        sendComic(comicList.random(), msg);
    } else {
        // search for a comic
        const comic = comicList.get(comicList.keyArray().find(comic => comic.includes(args.join(" ").toLowerCase())));
        if (!comic) {
            msg.channel.send(`No results found for \`${args.join(" ")}\`!`);
            return msg.channel.stopTyping();
        }
        sendComic(comic, msg);
    }
};

async function sendComic(comic, msg) {
    const html = (await snekfetch.get(`https://www.theduckwebcomics.com/Powerup_Comics/${comic}/`)).body;
    const $ = cheerio.load(html);

    msg.channel.send({ files: [$(".page-image").first().attr("src")] });
    msg.channel.stopTyping();
}

async function fillComicList() {
    const html = (await snekfetch.get("https://www.theduckwebcomics.com/Powerup_Comics/4946728/")).body;
    const $ = cheerio.load(html);

    const list = $("#page_dropdown").children();

    for (let i = 0; i < list.length; i++) {
        comicList.set(list.eq(i).text().slice(3).toLowerCase(), list.eq(i).attr("value")); // kind of a weird way to do this but it works
    }
}