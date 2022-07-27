const snekfetch = require("snekfetch");
const sleep = require("util").promisify(setTimeout);
const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

const errorMsg = "Failed to create video! Probably an issue with your input.";
const obamaDownMsg = "Obama video generator is currently broken. Thanks, Obama.";

exports.commands = [
    new SlashCommandBuilder()
        .setName("obama")
        .setDescription("Generates an Obama TTS video.")
        .addStringOption(option =>
            option.setName("text")
                .setDescription("The text for Obama to say.")
                .setRequired(true))
];

exports.requiredPermissions = ["ATTACH_FILES"];

exports.obamaDown = false;

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    // go and get 'em
    await intr.deferReply({ ephemeral: guildSettings.ephemeral });
    const words = intr.options.getString("text");
    let request;

    try {
        request = await snekfetch.post("http://talkobamato.me/synthesize.py", { redirect: false }).attach("input_text", words);
    } catch (err) {
        intr.editReply({ content: exports.obamaDown ? obamaDownMsg : errorMsg, ephemeral: true });
        return;
    }

    //console.log(request.headers.location);
    const videoURLBase = `http://talkobamato.me/synth/output/${request.headers.location.split("=")[1]}`;
    const videoURL = `${videoURLBase}/obama.mp4`;
    const videoDoneURL = `${videoURLBase}/video_created.txt`;
    let videoDone = await snekfetch.get(videoDoneURL).catch(() => { });

    while (!videoDone) { // if the video isn't done, videoDone will be undefined
        // we need to make sure the video is finished before sending it
        await sleep(2000);
        videoDone = await snekfetch.get(videoDoneURL).catch(() => { });
    }
    // video should be done now, send it
    intr.editReply({ files: [videoURL] }).catch(() => intr.editReply(exports.obamaDown ? obamaDownMsg : errorMsg));
};