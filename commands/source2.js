const Jimp = require("jimp");
const { Client, Message, MessageAttachment } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "source2",
    usage: "source2 <text>",
    info: "Generates a source 2 engine logo"
};

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length <= 0) return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });

    msg.channel.sendTyping();

    for (let i = 0; i < args.length; i++) {
        args[i] = args[i].replace(/[^a-zA-Z0-9"!`?'.,;:()[\]{}<>|/@\\^$\-%+=#_&~*]+/g, "");
    }

    if (args.join(" ").length === 0) args[0] = " ";

    if (args.join(" ").length > 500) {
        msg.channel.send("Too many characters!");
        return;
    }

    const font = await Jimp.loadFont("./sourcelogo/coolvetica.fnt");
    const image = new Jimp(Jimp.measureText(font, args.join(" ")), 210);
    const logo = await Jimp.read("./sourcelogo/s2logo.png");

    image.print(font, 0, -35, args.join(" "));
    image.contain(image.bitmap.width + 132, image.bitmap.height, Jimp.HORIZONTAL_ALIGN_LEFT);
    image.composite(logo, image.bitmap.width - logo.bitmap.width - 1, 0);

    msg.channel.send({ files: [new MessageAttachment(await image.getBufferAsync(Jimp.MIME_PNG), "logo.png")] });
};