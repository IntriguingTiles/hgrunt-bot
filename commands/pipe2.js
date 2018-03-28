const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "pipe2",
    usage: "pipe2",
    info: "GARFIELD!!"
};

/**
 * @param {Client} client
 * @param {Message} msg
 */
exports.run = async (client, msg) => {
    msg.channel.send({ files: ["https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/1978/1978-07-28.gif"] });
};