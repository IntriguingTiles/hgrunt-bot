const moment = require("moment");
const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const FileType = require("file-type");
const { Client, Message, MessageAttachment } = require("discord.js"); // eslint-disable-line no-unused-vars

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
    let attachment;
    msg.channel.startTyping();

    if (args.length === 0) {
        let errCount = 0;

        while (errCount < 5) {
            try {
                await msg.channel.send(await randomComic());
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
                try {
                    attachment = await comicOn(moment().format("YYYY-MM-DD"));
                } catch (err) {
                    msg.channel.stopTyping();
                    return msg.channel.send("Comic for today not found.");
                }

                await msg.channel.send(attachment);
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

            try {
                attachment = await comicOn(date.format("YYYY-MM-DD"));
            } catch (err) {
                msg.channel.stopTyping();
                return msg.channel.send("Comic not found.");
            }

            await msg.channel.send(attachment);
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

// Takes a date string in YYYY-MM-DD format, and returns a
// MessageAttachment with that day's comic image.
async function comicOn(date) {
    // The direct image link seems to no longer be predictable, but it
    // can be readily parsed out of the meta tags of the comic page.
    let pageUrl = `https://www.gocomics.com/garfield/${date.replace(/-/g, "/")}`;

    // Non-existent comics now get a 302.
    let pageResponse = await snekfetch.get(pageUrl, {redirect: false});
    if (pageResponse.statusCode != 200) {
        throw new Error();
    }

    let $ = cheerio.load(pageResponse.body);
    let imgUrl = $("meta[property='og:image']").attr("content");
    let imgBuffer = (await snekfetch.get(imgUrl)).body;

    // The URLs no longer have an extension, so they don't embed in
    // Discord unless we change the filename.  And we might as well
    // change it anyway, to show the date.  As far as I can tell, the
    // old comics that existed before the redirect are still GIF but new
    // comics are JPEG.
    console.log(imgBuffer);
    let imgType = FileType(imgBuffer);
    let imgName = `${date}.${imgType.ext}`;
    return new MessageAttachment(imgBuffer, imgName);
}

async function randomComic() {
    let date;

    do {
        date = `${Math.floor(Math.random() * (new Date().getFullYear() + 1 - 1978) + 1978)}-${randomMonth()}-${randomDay()}`;
    } while (!moment(date, moment.ISO_8601).isValid() || moment(date, moment.ISO_8601).isBefore(moment("1978-06-19", moment.ISO_8601)) || moment(date, moment.ISO_8601).isAfter(moment()));

    return await comicOn(date);
}

function randomMonth() {
    const month = Math.floor(Math.random() * 12 + 1);
    return month.toString().length === 1 ? `0${month}` : month.toString();
}

function randomDay() {
    const day = Math.floor(Math.random() * 31 + 1);
    return day.toString().length === 1 ? `0${day}` : day.toString();
}
