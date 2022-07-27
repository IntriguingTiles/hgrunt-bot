const fs = require("fs");
const voice = require("../utils/voice.js");
const moment = require("moment");
require("moment-duration-format");
const { Client, ChatInputCommandInteraction, AutocompleteInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

const hgruntVoiceLines = fs.readdirSync("./voice/hgrunt").reverse();
const voxVoiceLines = fs.readdirSync("./voice/vox");
const metrocopVoiceLines = fs.readdirSync("./voice/metropolice");
const combineVoiceLines = fs.readdirSync("./voice/combine_soldier");
const overwatchVoiceLines = fs.readdirSync("./voice/overwatch");

const rateLimitedUsers = new Map();

exports.commands = [
    new SlashCommandBuilder()
        .setName("say")
        .setDescription("Plays various Half-Life voice lines in voice chat.")
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("speaker")
                .setDescription("The speaker of the words.")
                .setRequired(true)
                .addChoices(
                    { name: "HGrunt", value: "hgrunt" },
                    { name: "VOX", value: "vox" },
                    { name: "Metrocop", value: "metrocop" },
                    { name: "Combine", value: "combine" },
                    { name: "Overwatch", value: "overwatch" },
                ))
        .addStringOption(option =>
            option.setName("words")
                .setDescription("The words to speak separated by spaces.")
                .setAutocomplete(true)
                .setRequired(true))
];

exports.disabledInDMs = true;

/**
 * @param {Client} client 
 */
exports.init = client => {
    voice.init(client);
};

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    const shouldLimit = guildSettings.limits;
    const words = intr.options.getString("words").trim().split(" ");

    if (shouldLimit && words.length >= 20) {
        intr.reply({ content: "Too many words! If you have the `Manage Server` permission, use `/config` to disable the limits.", ephemeral: true });
        return;
    }

    switch (intr.options.getString("speaker")) {
        case "vox":
            parse(intr, words, guildSettings, voxVoiceLines, "dadeda.wav");
            break;
        case "metrocop":
            parse(intr, words, guildSettings, metrocopVoiceLines, "on1.wav", "off1.wav");
            break;
        case "combine":
            parse(intr, words, guildSettings, combineVoiceLines, "on1.wav", "off1.wav");
            break;
        case "overwatch":
            parse(intr, words, guildSettings, overwatchVoiceLines, "on1.wav", "off1.wav");
            break;
        case "hgrunt":
            parse(intr, words, guildSettings, hgruntVoiceLines, "clik.wav", "clik.wav");
            break;
    }
};

/**
 * 
 * @param {Client} client 
 * @param {AutocompleteInteraction} intr 
 */
exports.autocomplete = async (client, intr) => {
    const curWord = intr.options.getFocused().split(" ").at(-1);
    const prevWords = intr.options.getFocused().split(" ").slice(0, -1).join(" ") + " ";
    let lines;

    switch (intr.options.getString("speaker")) {
        case "vox":
            lines = voxVoiceLines;
            break;
        case "metrocop":
            lines = metrocopVoiceLines;
            break;
        case "combine":
            lines = combineVoiceLines;
            break;
        case "overwatch":
            lines = overwatchVoiceLines;
            break;
        case "hgrunt":
            lines = hgruntVoiceLines;
            break;
        default:
            lines = [];
            break;
    }

    intr.respond(lines.filter(v => v.startsWith(curWord.toLowerCase())).slice(0, 25).map(v => v.replace(".wav", "")).map(v => ({ name: prevWords + v, value: prevWords + v })));
};

/**
 * @param {ChatInputCommandInteraction} intr
 * @param {string[]} args 
 * @param {string[]} voiceLines 
 * @param {string} firstLine 
 * @param {string} lastLine 
 */
async function parse(intr, args, guildSettings, voiceLines, firstLine, lastLine) {
    const shouldLimit = guildSettings.limits;
    if (rateLimitedUsers.has(intr.user.id)) {
        intr.reply({ content: `You can run that command in ${moment(rateLimitedUsers.get(intr.user.id)).diff(Date.now(), "seconds")} seconds.`, ephemeral: true });
        return;
    }

    if (!intr.member.voice.channel) return intr.reply({ content: "Join a voice channel first!", ephemeral: true });
    const location = getVoiceLineLocation(voiceLines);

    const lines = [location + firstLine];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        let foundLine = false;

        if (shouldLimit && args.filter(item => item.replace(/[!,.]/g, "").toLowerCase() === arg.replace(/[!,.]/g, "").toLowerCase()).length > 3) {
            intr.reply({ content: `You used the word \`${arg}\` too many times! If you have the \`Manage Server\` permission, use \`/config\` to disable the limits.`, ephemeral: true });
            return;
        }

        if (voiceLines.includes(`${arg.toLowerCase().replace(",", "").replace(".", "")}.wav`)) {
            lines.push(`${location}${arg.toLowerCase().replace(",", "").replace(".", "")}.wav`);
            foundLine = true;
        } else {
            for (let j = 0; j < voiceLines.length; j++) {
                const voiceLine = voiceLines[j];

                if (voiceLine.startsWith(arg.toLowerCase().replace(",", "").replace(".", ""))) {
                    // found the voice line
                    lines.push(location + voiceLine);
                    foundLine = true;
                    break;
                }
            }
        }

        if (!foundLine) {
            intr.reply({ content: `I couldn't find the word \`${arg}\` in my word list!\nMy word list is available at https://bot.hgrunt.xyz.`, ephemeral: true });
            return;
        }

        if (arg.includes(",")) lines.push("_comma.wav");
        if (arg.includes(".")) lines.push("_period.wav");
    }

    if (lastLine) lines.push(location + lastLine);
    intr.client.wordsSaid += args.length;
    try {
        await voice.addLines(intr, lines);
        intr.reply("👌").catch(() => { });
    } catch {
        // already posted fail message
    }

    if (shouldLimit) {
        rateLimitedUsers.set(intr.user.id, Date.now() + 10000);
        setTimeout(() => {
            rateLimitedUsers.delete(intr.user.id);
        }, 10000);
    }
}

function getVoiceLineLocation(voiceLines) {
    switch (voiceLines) {
        case hgruntVoiceLines: return "./voice/hgrunt/";
        case voxVoiceLines: return "./voice/vox/";
        case metrocopVoiceLines: return "./voice/metropolice/";
        case combineVoiceLines: return "./voice/combine_soldier/";
        case overwatchVoiceLines: return "./voice/overwatch/";
    }
}