const fs = require("fs");
const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

const strips = fs.readdirSync("./gmg");

exports.commands = [
    new SlashCommandBuilder()
        .setName("nogf2")
        .setDescription("View a Garfield minus Garfield comic.")
];

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["gmg"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    const strip = "./gmg/" + strips[Math.floor(Math.random() * strips.length)];

    intr.reply({ files: [strip], ephemeral: guildSettings.ephemeral });
};