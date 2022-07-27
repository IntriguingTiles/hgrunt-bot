const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const snekfetch = require("snekfetch");
const Jimp = require("jimp");

const { SlashCommandBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("tti")
        .setDescription("Generates an image based off of a description.")
        .addStringOption(option =>
            option.setName("text")
                .setDescription("A description of the image.")
                .setRequired(true))
];

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    for (let attempts = 0; attempts < 5; attempts++) {
        try {
            const request = await snekfetch.post("https://vision-explorer.allenai.org/api/xlxmert").attach("params", JSON.stringify({ caption: intr.options.getString("text") }));
            const img = new Jimp(request.body.answer.image.length, request.body.answer.image.length);
            img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
                this.bitmap.data[idx] = request.body.answer.image[y][x][0];
                this.bitmap.data[idx + 1] = request.body.answer.image[y][x][1];
                this.bitmap.data[idx + 2] = request.body.answer.image[y][x][2];
                this.bitmap.data[idx + 3] = 0xFF;
            });
            await intr.reply({ files: [await img.getBufferAsync(Jimp.AUTO)], ephemeral: guildSettings.ephemeral });
            return;
        } catch (err) {
            // cheating
        }
    }

    intr.reply({ content: "Failed to generate image.", ephemeral: true });
};