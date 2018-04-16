const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "prefix",
    usage: "prefix <prefix>",
    info: "Changes the prefix for commands"
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (msg.member.hasPermission("MANAGE_GUILD")) {
        const guildSettings = client.guildSettings.get(msg.guild.id);
        if (args.length !== 1) return msg.channel.send(`\`\`\`Usage: ${guildSettings.prefix}prefix <prefix>\`\`\``);

        guildSettings.prefix = args[0];

        client.guildSettings.set(msg.guild.id, guildSettings);

        msg.channel.send(`The prefix has been successfully updated to \`${guildSettings.prefix}\`!`);
    } else {
        msg.reply("You need to have the `Manage Server` permission to use this command!");
    }
};