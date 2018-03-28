const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 */
exports.run = async (client, msg) => {
    if (msg.guild.id === "154305477323390976") {
        msg.channel.send("<@167490818658140160>");
    }
};