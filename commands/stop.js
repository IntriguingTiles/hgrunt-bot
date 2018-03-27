const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 */
exports.run = async (client, msg) => {
    if (msg.author.id !== "221017760111656961") {
        msg.reply(":no_entry: **I! WILL! KICK! YOUR! ASS!** :no_entry:");
        return;
    }
    
    await msg.channel.send("Safely shutting down...");
    client.guildSettings.db.close();
    await client.destroy();
    process.exit(0);
};