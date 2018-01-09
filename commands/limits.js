const {Client, Message} = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 */
exports.run = async(client, msg) => {
    if (msg.member.hasPermission("MANAGE_GUILD")) {
        const guildSettings = client.guildSettings.get(msg.guild.id);

        guildSettings.limits = !guildSettings.limits;

        client.guildSettings.set(msg.guild.id, guildSettings);

        if (guildSettings.limits) {
            msg.channel.send("Limits enabled!");
        } else {
            msg.channel.send("Limits disabled!");
        }
    } else {
        msg.reply("You need to have the `Manage Server` permission to use this command!");
    }
};