const garfield = require("garfield");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.aliases = ["gf", "gar"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (args.length === 0) {
        msg.channel.send({ files: [garfield.random()] });
    } else if (args.length === 3) {
        // i hate mondays
    } else if (args.length === 1) {
        try {
            if (args[0].startsWith("l")) return await msg.channel.send({ files: [garfield.latest()]});
            const date = args[0].split(/[-/]/g);

            if (date.length !== 3) return msg.channel.send("```Usage: !garfield [latest] [YYYY-MM-DD]```");
            if (date[0].length !== 4 || date[1].length !== 2 || date[2].length !== 2) return msg.channel.send("```Usage: !garfield [latest] [YYYY-MM-DD]```");

            if (date[1] === "09") date[1] = "009";

            await msg.channel.send({ files: [garfield.request(date[0], date[1].replace(/^0/, ""), date[2].replace(/^0/, ""))] });
        } catch (err) {
            if (err) return msg.channel.send(err.message);
            msg.channel.send("An error occured!");
        }
    } else {
        msg.channel.send("```Usage: !garfield [latest] [YYYY-MM-DD]```");
    }
};