const {Client, Message} = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async(client, msg, args) => {
    if (msg.member.hasPermission("MANAGE_GUILD")) {
        const guildSettings = client.guildSettings.get(msg.guild.id);
        if (args.length !== 1) return msg.channel.send(`\`\`\`Usage: ${guildSettings.prefix}prefix <prefix>\`\`\``);

        guildSettings.prefix = args[0];
        msg.channel.send(`The prefix has been succesfully updated to \`${guildSettings.prefix}\`!`);
    } else {
        msg.reply("You need to have the `Manage Server` permission to use this command!");
    }
};