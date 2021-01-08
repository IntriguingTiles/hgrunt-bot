const fs = require("fs");
const tempMessage = require("../utils/tempmessage.js");
const voice = require("../utils/voice.js");
const moment = require("moment");
require("moment-duration-format");
const translate = require("../utils/translate.js");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const hgruntVoiceLines = fs.readdirSync("./voice/hgrunt").reverse();
const voxVoiceLines = fs.readdirSync("./voice/vox");
const metrocopVoiceLines = fs.readdirSync("./voice/metropolice");
const combineVoiceLines = fs.readdirSync("./voice/combine_soldier");
const overwatchVoiceLines = fs.readdirSync("./voice/overwatch");

const rateLimitedUsers = new Map();

exports.help = {
    name: "say",
    usage: "say [vox|metrocop|combine|overwatch] <words>",
    info: "Speaks words in a voice channel"
};

exports.requiredPermissions = ["ADD_REACTIONS"];
exports.disabledInDMs = true;

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    const shouldLimit = guildSettings.limits;
    if (shouldLimit && args.length >= 20) {
        msg.react("❌").catch(() => { }); // silently fail
        msg.channel.send(await translate(`Too many words! If you have the \`Manage Server\` permission, use \`${guildSettings.prefix}config limits\` to disable the limits.`));
        return;
    }
    if (args.length > 0) {
        switch (args[0]) {
            case "vox":
                if (args.length < 2) return msg.channel.send(`Usage: ${guildSettings.prefix}say [vox] <words>`, { code: "" });
                args.shift(); // remove vox from args
                parse(msg, args, guildSettings, voxVoiceLines, "dadeda.wav");
                break;
            case "metrocop":
                if (args.length < 2) return msg.channel.send(`Usage: ${guildSettings.prefix}say [metrocop] <words>`, { code: "" });
                args.shift();
                parse(msg, args, guildSettings, metrocopVoiceLines, "on1.wav", "off1.wav");
                break;
            case "combine":
                if (args.length < 2) return msg.channel.send(`Usage: ${guildSettings.prefix}say [combine] <words>`, { code: "" });
                args.shift();
                parse(msg, args, guildSettings, combineVoiceLines, "on1.wav", "off1.wav");
                break;
            case "overwatch":
                if (args.length < 2) return msg.channel.send(`Usage: ${guildSettings.prefix}say [overwatch] <words>`, { code: "" });
                args.shift();
                parse(msg, args, guildSettings, overwatchVoiceLines, "on1.wav", "off1.wav");
                break;
            default:
                parse(msg, args, guildSettings, hgruntVoiceLines, "clik.wav", "clik.wav");
        }
    } else {
        msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });
    }
};

/**
 * @param {Message} msg
 * @param {string[]} args 
 * @param {string[]} voiceLines 
 * @param {string} firstLine 
 * @param {string} lastLine 
 */
async function parse(msg, args, guildSettings, voiceLines, firstLine, lastLine) {
    const shouldLimit = guildSettings.limits;
    if (rateLimitedUsers.has(msg.author.id)) {
        tempMessage(msg.channel, await translate(`You can run that command in ${moment(rateLimitedUsers.get(msg.author.id)).diff(Date.now(), "seconds")} seconds.`), 5000);
        return;
    }

    if (!msg.member.voice.channel) return msg.channel.send(await translate("Join a voice channel first!"));
    const location = getVoiceLineLocation(voiceLines);

    const lines = [location + firstLine];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        let foundLine = false;

        if (shouldLimit && args.filter(item => item.replace("!", "").replace(",", "").replace(".", "").toLowerCase() === arg.replace("!", "").replace(",", "").replace(".").toLowerCase()).length > 3) {
            msg.react("❌").catch(() => { });
            msg.channel.send(await translate(`You used the word \`${arg}\` too many times! If you have the \`Manage Server\` permission, use \`${guildSettings.prefix}config limits\` to disable the limits.`));
            return;
        }

        if (voiceLines.includes(`${arg.toLowerCase().replace(",", "").replace(".", "")}.wav`)) {
            console.log();
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
            msg.react("❌").catch(() => { });
            msg.channel.send(await translate(`I couldn't find the word \`${arg}\` in my word list!\nMy word list is available at https://bot.hgrunt.xyz.`));
            return;
        }

        if (arg.includes(",")) lines.push("_comma.wav");
        if (arg.includes(".")) lines.push("_period.wav");
    }

    if (lastLine) lines.push(location + lastLine);
    msg.client.wordsSaid += args.length;
    msg.react("👌").catch(() => { });
    voice.addLines(msg, lines);

    if (shouldLimit) {
        rateLimitedUsers.set(msg.author.id, Date.now() + 10000);
        setTimeout(() => {
            rateLimitedUsers.delete(msg.author.id);
        }, 10000);
    }
}

function getVoiceLineLocation(voiceLines) {
    switch (voiceLines) {
        case hgruntVoiceLines:      return "./voice/hgrunt/";
        case voxVoiceLines:         return "./voice/vox/";
        case metrocopVoiceLines:    return "./voice/metropolice/";
        case combineVoiceLines:     return "./voice/combine_soldier/";
        case overwatchVoiceLines:   return "./voice/overwatch/";
    }
}