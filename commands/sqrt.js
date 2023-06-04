const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const moment = require("moment");
const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("sqrt")
        .setDescription("View Square Root of Minus Garfield comics.")
        .addSubcommand(cmd =>
            cmd.setName("random")
                .setDescription("View a random Square Root of Minus Garfield comic."))
        .addSubcommand(cmd =>
            cmd.setName("latest")
                .setDescription("View the latest Square Root of Minus Garfield comic."))
        .addSubcommand(cmd =>
            cmd.setName("date")
                .setDescription("View the Square Root of Minus Garfield comic published on the specified date.")
                .addIntegerOption(option =>
                    option.setName("year")
                        .setDescription("The year of the comic.")
                        .setRequired(true)
                        .setMinValue(1978))
                .addIntegerOption(option =>
                    option.setName("month")
                        .setDescription("The month of the comic.")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName("day")
                        .setDescription("The day of the comic.")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31)))
];

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["sromg"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    let url = "http://www.mezzacotta.net";

    switch (intr.options.getSubcommand()) {
        case "random":
        url += "/garfield/?comic=0"; // 0 -> random
            sendComic(url, intr, guildSettings);
            break;
        case "latest":
        url += "/garfield/"; // no args -> latest
            sendComic(url, intr, guildSettings);
            break;
        case "date": {
            const date = moment({ year: intr.options.getInteger("year"), month: intr.options.getInteger("month") - 1, day: intr.options.getInteger("day") });

            if (date.isBefore(moment("2008-11-15", moment.ISO_8601))) {
                intr.reply({ content: "You can't search for comics earlier than 2008-11-15!", ephemeral: true });
                return;
            }

        const html = (await snekfetch.get("http://www.mezzacotta.net/garfield/archive.php")).body;
        const $ = cheerio.load(html);
            const comic = $("a").filter(function () { return $(this).text().trim() === date.format("YYYY-MM-DD"); }).first().attr("href"); //eslint-disable-line brace-style

        if (!comic) {
                intr.reply({ content: `No comic was found for \`${date.format("YYYY-MM-DD")}\``, ephemeral: true });
            return;
        }

        url += comic;
            sendComic(url, intr, guildSettings);
            break;
        }
    }
};

async function sendComic(url, intr, guildSettings) {
    const html = (await snekfetch.get(url)).body;
    if (!html) {
        intr.reply({ content: "Failed to get comic!", ephemeral: true });
    }

    const $ = cheerio.load(html);
    const img = "http://www.mezzacotta.net/" + $("img").eq(1).attr("src");

    intr.reply({ files: [img], ephemeral: guildSettings.ephemeral });
}
