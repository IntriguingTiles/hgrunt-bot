const moment = require("moment");
const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const FileType = require("file-type");
const { Client, ChatInputCommandInteraction, AttachmentBuilder } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("garfield")
        .setDescription("View Garfield comics.")
        .addSubcommand(cmd =>
            cmd.setName("random")
                .setDescription("View a random Garfield comic."))
        .addSubcommand(cmd =>
            cmd.setName("latest")
                .setDescription("View the latest Garfield comic."))
        .addSubcommand(cmd =>
            cmd.setName("date")
                .setDescription("View the Garfield comic published on the specified date.")
                .addIntegerOption(option =>
                    option.setName("year")
                        .setDescription("The year of the comic.")
                        .setRequired(true)
                        .setMinValue(1978))
                .addIntegerOption(option =>
                    option.setName("month")
                        .setDescription("The month of the comic.")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName("day")
                        .setDescription("The day of the comic.")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31)))
];

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["gf"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    let attachment;

    switch (intr.options.getSubcommand()) {
        case "random": {
            let errCount = 0;

            while (errCount < 5) {
                try {
                    await intr.reply({ files: [await randomComic()], ephemeral: guildSettings.ephemeral });
                    return;
                } catch (err) {
                    console.log(err);
                    errCount++;
                }
            }

            intr.reply({ content: "Failed to get a random comic.", ephemeral: true });
            break;
        }
        case "latest":
            try {
                attachment = await comicOn(moment().format("YYYY-MM-DD"));
            } catch (err) {
                console.log(err);
                return intr.reply({ content: "Comic for today not found.", ephemeral: true });
            }

            await intr.reply({ files: [attachment], ephemeral: guildSettings.ephemeral });
            break;
        case "date": {
            const date = moment({ year: intr.options.getInteger("year"), month: intr.options.getInteger("month") - 1, day: intr.options.getInteger("day") });

            if (date.isBefore(moment("1978-06-19", moment.ISO_8601))) {
                intr.reply({ content: "You can't search for comics earlier than 1978-06-19!\nUse `/jon` to view the prototype Garfield comics.", ephemeral: true });
                return;
            }

            try {
                attachment = await comicOn(date.format("YYYY-MM-DD"));
            } catch (err) {
                return intr.reply({ content: "Comic not found.", ephemeral: true });
            }

            await intr.reply({ files: [attachment], ephemeral: guildSettings.ephemeral });
            break;
        }
    }
};

/**
 * 
 * @param {String} date Format is YYYY-MM-DD
 * @returns {AttachmentBuilder} attachment
 */
async function comicOn(date) {
    // try to get the higher quality comics first
    // don't bother if the year is past 1992 since there are no archives after that
    if (moment(date, moment.ISO_8601).isBefore(moment("1992-02-26", moment.ISO_8601))) {
        try {
            const img = (await snekfetch.get(`https://web.archive.org/web/20190203003353if_/https://d1ejxu6vysztl5.cloudfront.net/comics/garfield/${date.split("-")[0]}/${date}.gif`)).body;
            return new AttachmentBuilder(img, { name: `${date}.gif` });
        } catch (err) { /* */ }
    }

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
    return new AttachmentBuilder(imgBuffer, { name: imgName });
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
