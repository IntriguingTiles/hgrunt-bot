const { Client, ChatInputCommandInteraction, PermissionFlagsBits, } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("config")
        .setDescription("Configures various HGrunt features.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(cmd =>
            cmd.setName("ratelimits")
                .setDescription("Configures ratelimits for /say.")
                .addBooleanOption(option =>
                    option.setName("enabled")
                        .setDescription("Whether ratelimits should be enabled for /say.")
                        .setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("ephemeral")
                .setDescription("Configures whether HGrunt's replies should only be visible to the user.")
                .addBooleanOption(option =>
                    option.setName("enabled")
                        .setDescription("Whether HGrunt's replies should only be visible to the user.")
                        .setRequired(true)))
];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    switch (intr.options.getSubcommand()) {
        case "ratelimits":
            guildSettings.limits = intr.options.getBoolean("enabled");
            client.guildSettings.set(intr.guild.id, guildSettings);

            if (guildSettings.limits) {
                intr.reply("Limits enabled.");
            } else {
                intr.reply("Limits disabled.");
            }
            break;
        case "ephemeral":
            guildSettings.ephemeral = intr.options.getBoolean("enabled");
            client.guildSettings.set(intr.guild.id, guildSettings);

            if (guildSettings.ephemeral) {
                intr.reply("Ephemeral replies enabled.");
            } else {
                intr.reply("Ephemeral replies disabled.");
            }
            break;
    }
};