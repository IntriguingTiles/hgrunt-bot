const garfield = require("garfield");
const moment = require("moment");
const translate = require("../utils/translate.js");
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
                await msg.channel.send({ files: [garfield.random()] });
                msg.channel.stopTyping();
                return;
            } catch (err) {
                errCount++;
            }
        }

        msg.channel.send(await translate("Failed to get a random comic!"));
        msg.channel.stopTyping();
    } else if (args.length === 1) {
        try {
            if (args[0].startsWith("l")) {
                //console.log(`https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/${new Date().getFullYear()}/${moment().format("YYYY-MM-DD")}.gif`);
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
                msg.channel.send(await translate(`You can't search for comics earlier than 1978-06-19!\nUse \`${guildSettings.prefix}jon\` to view the prototype Garfield comics.`));
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