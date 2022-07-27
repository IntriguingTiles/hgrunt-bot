const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("nogf")
        .setDescription("View a randomly generated Garfield minus Garfield comic.")
];

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["igmg"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    const html = (await snekfetch.get("http://garfield.zweistein.cz/")).body;
    if (!html) {
        intr.reply({ content: "Failed to get comic!", ephemeral: true });
        return;
    }

    const $ = cheerio.load(html);
    const img = "http://garfield.zweistein.cz/" + $("img").first().attr("src");

    intr.reply({ files: [img], ephemeral: guildSettings.ephemeral });
};