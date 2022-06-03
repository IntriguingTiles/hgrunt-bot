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
    msg.channel.sendTyping();

    if (args.length === 0) {
        let errCount = 0;

        while (errCount < 5) {
            try {
                await msg.channel.send({ files: [await randomComic()] });
                return;
            } catch (err) {
                errCount++;
            }
        }

        msg.channel.send("Failed to get a random comic!");
    } else if (args.length === 1) {
        try {
            if (args[0].startsWith("l")) {
                try {
                    attachment = await comicOn(moment().format("YYYY-MM-DD"));
                } catch (err) {
                    return msg.channel.send("Comic for today not found.");
                }

                await msg.channel.send({ files: [attachment] });
                return;
            }

            const date = moment(args[0], moment.ISO_8601);

            if (!date.isValid()) {
                msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });
                return;
            }

            if (date.isBefore(moment("1978-06-19", moment.ISO_8601))) {
                msg.channel.send(`You can't search for comics earlier than 1978-06-19!\nUse \`${guildSettings.prefix}jon\` to view the prototype Garfield comics.`);
                return;
            }

            try {
                attachment = await comicOn(date.format("YYYY-MM-DD"));
            } catch (err) {
                return msg.channel.send("Comic not found.");
            }

            await msg.channel.send({ files: [attachment] });
        } catch (err) {
            if (err) msg.channel.send(err.message);
        }
    } else {
        msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });
    }
};

/**
 * 
 * @param {String} date Format is YYYY-MM-DD
 * @returns {MessageAttachment} attachment
 */
async function comicOn(date) {
    // try to get the higher quality comics first
    try {
        const img = (await snekfetch.get(`https://web.archive.org/web/20190203003353if_/https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/${date.split("-")[0]}/${date}.gif`)).body;
        return new MessageAttachment(img, `${date}.gif`);
    } catch (err) { /* */ }

    // The direct image link seems to no longer be predictable, but it
    // can be readily parsed out of the meta tags of the comic page.
    const pageUrl = `https://www.gocomics.com/garfield/${date.replace(/-/g, "/")}`;

    // Non-existent comics now get a 302.
    const pageResponse = await snekfetch.get(pageUrl, { redirect: false });
    if (pageResponse.statusCode !== 200) {
        throw new Error();
    }

    const $ = cheerio.load(pageResponse.body);
    const imgUrl = $("meta[property='og:image']").attr("content");
    const imgBuffer = (await snekfetch.get(imgUrl)).body;

    // The URLs no longer have an extension, so they don't embed in
    // Discord unless we change the filename.  And we might as well
    // change it anyway, to show the date.  As far as I can tell, the
    // old comics that existed before the redirect are still GIF but new
    // comics are JPEG.
    const imgType = FileType(imgBuffer);
    const imgName = `${date}.${imgType.ext}`;
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
