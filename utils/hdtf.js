const Jimp = require("jimp");
const { Client, Message, Attachment } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Message} msg
 * @param {string[]} args
 * @param {string} banner
 */
module.exports = async (msg, args, banner) => {
    let realLength = 0;

    for (let i = 0; i < args.length; i++) {
        args[i] = args[i].replace(/[^a-zA-Z0-9.,'\-!?]+/g, "");
        realLength += args[i].length;
    }

    const wordsImageWidth = (realLength + args.length) * 34 - 34;
    const wordsImageHeight = 44;

    new Jimp(wordsImageWidth, wordsImageHeight, async function (err, image) {      
        let currentX = 0;

        for (let i = 0; i < args.length; i++) {
            for (let j = 0; j < args[i].length; j++) {
                let char = args[i].charAt(j);
                if (char === "?") char = "qmark";

                const letter = await Jimp.read(`./hdtf/${char}.png`);
                image.composite(letter, currentX, 0);
                currentX += 34;
            }
            currentX += 34;
        }
        const bannerImage = await Jimp.read(banner);
        
        image.resize(bannerImage.bitmap.width, 44, Jimp.RESIZE_NEAREST_NEIGHBOR);
        bannerImage.composite(image, 0, bannerImage.bitmap.height - 44);
        bannerImage.scale(2, Jimp.RESIZE_NEAREST_NEIGHBOR);
        bannerImage.getBuffer(Jimp.AUTO, function (err, buffer) {
            msg.channel.send(new Attachment(buffer, "hdtf.png"));
        });
    });
};