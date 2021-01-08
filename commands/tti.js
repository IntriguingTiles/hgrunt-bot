const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars
const snekfetch = require("snekfetch");
const Jimp = require("jimp");

exports.help = {
    name: "tti",
    usage: "tti <text>",
    info: "Text to image"
};

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();
    for (let attempts = 0; attempts < 5; attempts++) {
        try {
            const request = await snekfetch.post("https://vision-explorer.allenai.org/api/xlxmert").attach("params", JSON.stringify({ caption: args.join(" ") }));
            const img = new Jimp(request.body.answer.image.length, request.body.answer.image.length);
            img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
                this.bitmap.data[idx] = request.body.answer.image[y][x][0];
                this.bitmap.data[idx + 1] = request.body.answer.image[y][x][1];
                this.bitmap.data[idx + 2] = request.body.answer.image[y][x][2];
                this.bitmap.data[idx + 3] = 0xFF;
            });
            msg.channel.stopTyping();
            await msg.channel.send({ files: [await img.getBufferAsync(Jimp.AUTO)] });
            return;
        } catch (err) {
            // cheating
        }
    }
    msg.channel.stopTyping();
    msg.channel.send("Failed to generate image.");
};