const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "pipe0",
    usage: "pipe0",
    info: "GARFIELD!!"
};

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {Message} msg
 */
exports.run = async (client, msg) => {
    msg.channel.send({ files: ["./jon/1976-12-23.png"] });
};