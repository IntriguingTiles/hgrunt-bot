const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const moment = require("moment");

const imgs = fs.readdirSync("./jon");

exports.commands = [
    new SlashCommandBuilder()
        .setName("jon")
        .setDescription("View prototype Garfield comics.")
        .addSubcommand(cmd =>
            cmd.setName("random")
                .setDescription("View a random Jon comic."))
        .addSubcommand(cmd =>
            cmd.setName("date")
                .setDescription("View the Jon comic published on the specified date.")
                .addIntegerOption(option =>
                    option.setName("year")
                        .setDescription("The year of the comic.")
                        .setRequired(true)
                        .setMinValue(1976)
                        .setMaxValue(1978))
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

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    switch (intr.options.getSubcommand()) {
        case "random": {
            const img = Math.floor(Math.random() * imgs.length);
            intr.reply({ content: `Comic date: ${imgs[img].split(".")[0]}`, files: [`./jon/${imgs[img]}`], ephemeral: guildSettings.ephemeral });
            break;
        }
        case "date": {
            const date = moment({ year: intr.options.getInteger("year"), month: intr.options.getInteger("month") - 1, day: intr.options.getInteger("day") });

            if (date.isBefore(moment("1976-01-08", moment.ISO_8601))) {
                intr.reply({ content: "You can't search for comics earlier than 1976-01-08!", ephemeral: true });
                return;
            }

            if (date.isAfter(moment("1978-03-02", moment.ISO_8601))) {
                intr.reply({ content: "You can't search for comics later than 1978-03-02!", ephemeral: true });
                return;
            }

            if (!fs.existsSync(`./jon/${date.format("YYYY-MM-DD")}.png`)) {
                intr.reply({ content: "That comic doesn't exist or hasn't been found yet.", ephemeral: true });
                return;
            }

            intr.reply({ files: [`./jon/${date.format("YYYY-MM-DD")}.png`], ephemeral: guildSettings.ephemeral });
            break;
        }
    }
};