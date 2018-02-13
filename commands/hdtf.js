const Jimp = require("jimp");
const { Client, Message, Attachment } = require("discord.js"); // eslint-disable-line no-unused-vars
const fs = require("fs");

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (args.length <= 0) return msg.channel.send("```Usage: !hdtf <words>```");

    let realLength = 0;

    for (let i = 0; i < args.length; i++) {
        args[i].replace(/[^A-z]+/g, "");
        realLength += args[i].length;
    }

    const wordsImageWidth = (realLength + args.length) * 34 - 34;
    const wordsImageHeight = 44;

    new Jimp(wordsImageWidth, wordsImageHeight, async function (err, image) {
        if (err) return msg.channel.send("Failed to create image!");
        let currentX = 0;

        for (let i = 0; i < args.length; i++) {
            for (let j = 0; j < args[i].length; j++) {
                const char = args[i].charAt(j);
                
                if (!fs.existsSync(`./hdtf/${char}.png`)) return msg.channel.send(`I can't use the character \`${char}\``);

                const letter = await Jimp.read(`./hdtf/${char}.png`);
                image.composite(letter, currentX, 0);
                currentX += 34;
            }
            currentX += 34;
        }
        const bannerImage = await Jimp.read("./hdtf/banner.png");
        image.resize(bannerImage.bitmap.width, 44, Jimp.RESIZE_NEAREST_NEIGHBOR);
        bannerImage.composite(image, 0, bannerImage.bitmap.height - 44);
        bannerImage.scale(2, Jimp.RESIZE_NEAREST_NEIGHBOR);
        bannerImage.getBuffer(Jimp.AUTO, function (err, buffer) {
            msg.channel.send(new Attachment(buffer, "hdtf.png"));
            msg.channel.stopTyping();
        });
    });
};