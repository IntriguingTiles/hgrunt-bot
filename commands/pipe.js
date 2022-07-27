const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("pipe")
        .setDescription("View the pipe strip.")
];

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    intr.reply({ files: ["https://web.archive.org/web/20190203003353if_/https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/1978/1978-07-27.gif"], ephemeral: guildSettings.ephemeral });
};