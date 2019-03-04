const Jimp = require("jimp");
const translate = require("../utils/translate.js");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "sadcat",
    usage: "sadcat <image, url, or mention>",
    info: "sad kitty"
};

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["sc"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();
    if (args.length !== 0) {
        if (msg.mentions.users.size !== 0) return sendImage(msg.mentions.users.first().displayAvatarURL, msg); // mentions
        const idRegex = /[0-9]+/g;

        if (idRegex.test(args[0])) {
            try {
                return sendImage((await client.fetchUser(args[0].match(idRegex)[0])).displayAvatarURL, msg);
            } catch (err) { /* I'm cheating */ }
        }

        sendImage(args[0], msg);
    } else {
        if (msg.attachments.size !== 0) return sendImage(msg.attachments.first().url, msg);

        try {
            const msgs = await msg.channel.fetchMessages({ limit: 50 });
            const url = msgs.filter(msg => msg.attachments.size !== 0).find(msg => msg.attachments.first().width).attachments.first().url;
            sendImage(url, msg);
        } catch (err) {
            msg.channel.send(await translate("Failed to find an image in the last 50 messages!"));
            msg.channel.stopTyping();
        }
    }
};

/**
 * @param {string} url 
 * @param {Message} msg
 */
async function sendImage(url, msg) {
    try {
        const finalImg = new Jimp(720, 960, 0x000000FF); // new black image
        const sadCat = await Jimp.read("./sadcat.png");
        const img = await Jimp.read(url);
        img.scaleToFit(501, 382);
        finalImg.composite(img, 0, 207);
        finalImg.composite(sadCat, 0, 0);
        await msg.channel.send({ files: [await finalImg.getBufferAsync(Jimp.AUTO)] });
    } catch (err) {
        msg.channel.send(await translate("Bad URL or not an image!"));
    }

    msg.channel.stopTyping();
}