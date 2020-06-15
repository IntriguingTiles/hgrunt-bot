const moment = require("moment");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "garfield",
    usage: "garfield [latest] [YYYY-MM-DD]",
    info: "Now where could my pipe be?"
};

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["gf"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    msg.channel.startTyping();

    if (args.length === 0) {
        let errCount = 0;

        while (errCount < 5) {
            try {
                await msg.channel.send({ files: [randomComic()] });
                msg.channel.stopTyping();
                return;
            } catch (err) {
                errCount++;
            }
        }

        msg.channel.send("Failed to get a random comic!");
        msg.channel.stopTyping();
    } else if (args.length === 1) {
        try {
            if (args[0].startsWith("l")) {
                await msg.channel.send({ files: [`https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/${new Date().getFullYear()}/${moment().format("YYYY-MM-DD")}.gif`] });
                msg.channel.stopTyping();
                return;
            }

            const date = moment(args[0], moment.ISO_8601);

            if (!date.isValid()) {
                msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, {code: ""});
                msg.channel.stopTyping();
                return;
            }


            if (date.isBefore(moment("1978-06-19", moment.ISO_8601))) {
                msg.channel.send(`You can't search for comics earlier than 1978-06-19!\nUse \`${guildSettings.prefix}jon\` to view the prototype Garfield comics.`);
                msg.channel.stopTyping();
                return;
            }

            await msg.channel.send({ files: [`https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/${date.year()}/${date.format("YYYY-MM-DD")}.gif`] });
            msg.channel.stopTyping();
        } catch (err) {
            if (err) msg.channel.send(err.message);
            msg.channel.stopTyping();
        }
    } else {
        msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, {code: ""});
        msg.channel.stopTyping();
    }
};

function randomComic() {
    let date;

    do {
        date = `${Math.floor(Math.random() * (new Date().getFullYear() + 1 - 1978) + 1978)}-${randomMonth()}-${randomDay()}`;
    } while (!moment(date, moment.ISO_8601).isValid() || moment(date, moment.ISO_8601).isBefore(moment("1978-06-19", moment.ISO_8601)) || moment(date, moment.ISO_8601).isAfter(moment()));

    return `https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/${date.split("-")[0]}/${date}.gif`;
}

function randomMonth() {
    const month = Math.floor(Math.random() * 12 + 1);
    return month.toString().length === 1 ? `0${month}` : month.toString();
}

function randomDay() {
    const day = Math.floor(Math.random() * 31 + 1);
    return day.toString.length === 1 ? `0${day}` : day.toString();
}