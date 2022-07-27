const Jimp = require("jimp");
const { Client, ChatInputCommandInteraction, AttachmentBuilder } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("source")
        .setDescription("Generates a Source Engine logo.")
        .addStringOption(option =>
            option.setName("text")
                .setDescription("The text for the logo.")
                .setRequired(true))
];

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    const words = intr.options.getString("text").split(" ");

    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].replace(/[^a-zA-Z0-9"!`?'.,;:()[\]{}<>|/@\\^$\-%+=#_&~*]+/g, "");
    }

    if (words.join(" ").length === 0) words[0] = " ";

    if (words.join(" ").length > 500) {
        intr.reply({ content: "Too many characters!", ephemeral: true });
        return;
    }

    const font = await Jimp.loadFont("./sourcelogo/coolvetica.fnt");
    const image = new Jimp(Jimp.measureText(font, words.join(" ")), 210);
    const logo = await Jimp.read("./sourcelogo/logo.png");

    image.print(font, 0, -35, words.join(" "));
    image.contain(image.bitmap.width + 132, image.bitmap.height, Jimp.HORIZONTAL_ALIGN_LEFT);
    image.composite(logo, image.bitmap.width - logo.bitmap.width - 1, 0);

    intr.reply({ files: [new AttachmentBuilder(await image.getBufferAsync(Jimp.MIME_PNG), { name: "logo.png" })], ephemeral: guildSettings.ephemeral });
};