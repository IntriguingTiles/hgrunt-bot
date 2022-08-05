const Jimp = require("jimp");
const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("sadcat")
        .setDescription("Overlays the sad kitty on top of a given image.")
        .addSubcommand(cmd =>
            cmd.setName("user")
                .setDescription("Overlays the sad kitty on top of the specified user's profile picture.")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user.")
                        .setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("image")
                .setDescription("Overlays the sad kitty on top of the provided image.")
                .addAttachmentOption(option =>
                    option.setName("image")
                        .setDescription("The image.")
                        .setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("url")
                .setDescription("Overlays the sad kitty on top of the specified image URL.")
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("The URL.")
                        .setRequired(true)))
];

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["sc"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    await intr.deferReply({ ephemeral: guildSettings.ephemeral });

    switch (intr.options.getSubcommand()) {
        case "user":
            return sendImage(intr.options.getUser("user").displayAvatarURL({ extension: "png", size: 512 }), intr);
        case "image":
            return sendImage(intr.options.getAttachment("image").url, intr);
        case "url":
            return sendImage(intr.options.getString("url"), intr);
    }
};

/**
 * @param {string} url 
 * @param {ChatInputCommandInteraction} intr
 */
async function sendImage(url, intr) {
    try {
        const finalImg = new Jimp(720, 960, 0x000000FF); // new black image
        const sadCat = await Jimp.read("./sadcat.png");
        const img = await Jimp.read(url);
        img.scaleToFit(501, 382);
        finalImg.composite(img, 0, 207);
        finalImg.composite(sadCat, 0, 0);
        await intr.editReply({ files: [await finalImg.getBufferAsync(Jimp.AUTO)] });
    } catch (err) {
        intr.editReply("Bad URL or not an image!");
    }

}