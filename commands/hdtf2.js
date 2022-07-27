const hdtf = require("../utils/hdtf.js");

const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("hdtf2")
        .setDescription("Generates an HDTF banner.")
        .addStringOption(option =>
            option.setName("text")
                .setDescription("The text for the banner.")
                .setRequired(true))
];

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    hdtf(intr, "./hdtf/banner2.png", guildSettings);
};