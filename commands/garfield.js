const garfield = require("garfield");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.aliases = ["gf", "gar"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();
    if (args.length === 0) {
        msg.channel.send({ files: [garfield.random()] });
        msg.channel.stopTyping();
    } else if (args.length === 1) {
        try {
            if (args[0].startsWith("l")) {
                await msg.channel.send({ files: [garfield.latest()] });
                msg.channel.stopTyping();
            }
            const date = args[0].split(/[-/]/g);

            if (date.length !== 3) {
                msg.channel.send("```Usage: !garfield [latest] [YYYY-MM-DD]```");
                return msg.channel.stopTyping();
            }
            if (date[0].length !== 4 || date[1].length !== 2 || date[2].length !== 2) {
                msg.channel.send("```Usage: !garfield [latest] [YYYY-MM-DD]```");
                return msg.channel.stopTyping();
            }

            if (date[1] === "09") date[1] = "009";

            await msg.channel.send({ files: [garfield.request(date[0], date[1].replace(/^0/, ""), date[2].replace(/^0/, ""))] });
            msg.channel.stopTyping();
        } catch (err) {
            if (err) return msg.channel.send(err.message);
            msg.channel.send("An error occured!");
            msg.channel.stopTyping();
        }
    } else {
        msg.channel.send("```Usage: !garfield [latest] [YYYY-MM-DD]```");
        msg.channel.stopTyping();
    }
};