const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const { Client, ChatInputCommandInteraction, Collection, AutocompleteInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.help = {
    name: "powerup",
    usage: "powerup [search]",
    info: "Gets a random Powerup comic or searches for a Powerup comic."
};

exports.commands = [
    new SlashCommandBuilder()
        .setName("powerup")
        .setDescription("View Powerup comics.")
        .addStringOption(option =>
            option.setName("search")
                .setDescription("The title of the comic to search for.")
                .setAutocomplete(true))
];

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["pu"];

const comicList = new Collection();

fillComicList();

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    const search = intr.options.getString("search", false);

    if (!search) {
        // random comic
        sendComic(comicList.random(), intr, guildSettings);
    } else {
        // search for a comic
        const comic = comicList.find((value, key) => key.includes(search.toLowerCase()));

        if (!comic) {
            intr.reply({ content: `No results found for \`${search}\`!`, ephemeral: true });
            return;
        }

        sendComic(comic, intr, guildSettings);
    }
};

/**
 * 
 * @param {Client} client 
 * @param {AutocompleteInteraction} intr 
 */
exports.autocomplete = async (client, intr) => {
    const search = intr.options.getFocused();
    intr.respond(Array.from(comicList.keys()).filter(c => c.includes(search.toLowerCase())).slice(0, 25).map(c => ({ name: c, value: c })));
};

async function sendComic(comic, intr, guildSettings) {
    const html = (await snekfetch.get(`https://www.theduckwebcomics.com/Powerup_Comics/${comic}/`)).body;
    const $ = cheerio.load(html);

    intr.reply({ files: [`https://www.theduckwebcomics.com/${$(".page-image").first().attr("src")}`], ephemeral: guildSettings.ephemeral });
}

async function fillComicList() {
    const html = (await snekfetch.get("https://www.theduckwebcomics.com/Powerup_Comics/4946728/")).body;
    const $ = cheerio.load(html);

    const list = $("#page_dropdown").children();

    for (let i = 0; i < list.length; i++) {
        comicList.set(list.eq(i).text().slice(3).toLowerCase(), list.eq(i).attr("value")); // kind of a weird way to do this but it works
    }
}