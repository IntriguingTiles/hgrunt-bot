const garfield = require("garfield");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (args.length === 0) {
        msg.channel.send({ files: [garfield.latest()] });
    } else if (args.length === 3) {
        // i hate mondays
    } else if (args.length === 1) {
        if (args[0].startsWith("r")) return msg.channel.send({ files: [garfield.random()]}).catch(msg.channel.send("Failed to get random comic!"));
        const date = args[0].split(/[-/]/g);

        if (date.length !== 3) return msg.channel.send("```Usage: !garfield [random] [YYYY-MM-DD]```");
        if (date[0].length !== 4 || date[1].length !== 2 || date[2].length !== 2) msg.channel.send("```Usage: !garfield [random] [YYYY-MM-DD]```");
        
        msg.channel.send({files: [garfield.request(date[0], date[1], date[2])]});
    } else {
        msg.channel.send("```Usage: !garfield [random] [YYYY-MM-DD]```");
    }
};