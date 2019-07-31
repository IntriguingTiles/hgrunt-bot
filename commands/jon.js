const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars
const fs = require("fs");
const moment = require("moment");

const imgs = fs.readdirSync("./jon");

exports.help = {
    name: "jon",
    usage: "jon [YYYY-MM-DD]",
    info: "Now where could my candy cane be?"
};

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    msg.channel.startTyping();
    if (args.length === 0) {
        // post random image
        const img = Math.floor(Math.random() * imgs.length);
        msg.channel.send(`Comic date: ${imgs[img].split(".")[0]}`, { files: [`./jon/${imgs[img]}`] });
        msg.channel.stopTyping();
    } else {
        const date = moment(args[0], moment.ISO_8601);
        if (!date.isValid()) {
            msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });
            msg.channel.stopTyping();
            return;
        }

        if (date.isBefore(moment("1976-01-08", moment.ISO_8601))) {
            msg.channel.send("You can't search for comics earlier than 1976-01-08!");
            msg.channel.stopTyping();
            return;
        }

        if (date.isAfter(moment("1978-03-02", moment.ISO_8601))) {
            msg.channel.send("You can't search for comics later than 1978-03-02!");
            msg.channel.stopTyping();
            return;
        }

        if (!fs.existsSync(`./jon/${args[0]}.png`)) {
            msg.channel.send("That comic doesn't exist or hasn't been found yet.");
            msg.channel.stopTyping();
            return;
        }

        msg.channel.send({ files: [`./jon/${args[0]}.png`] });
        msg.channel.stopTyping();
    }
};