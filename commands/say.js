const fs = require("fs");
const tempMessage = require("../utils/tempmessage.js");
const voice = require("../utils/voice.js");
const moment = require("moment");
require("moment-duration-format");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const hgruntVoiceLines = fs.readdirSync("./hgrunt");
const voxVoiceLines = fs.readdirSync("./vox");

const rateLimitedUsers = new Map();

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (args.length <= 20) return tempMessage(msg.channel, "Too many words!", 5000);
    if (args.length > 0) {
        if (args[0] === "vox") {
            args.shift(); // remove vox from args
            parse(msg, args, voxVoiceLines, "dadeda.wav");
        } else {
            parse(msg, args, hgruntVoiceLines, "clik.wav", "clik.wav");
        }
    } else {
        tempMessage(msg.channel, "```Usage: h!say [vox] <words>```", 5000);
    }
};

/**
 * @param {Message} msg
 * @param {string[]} args 
 * @param {string[]} voiceLines 
 * @param {string} firstLine 
 * @param {string} lastLine 
 */
function parse(msg, args, voiceLines, firstLine, lastLine) {
    if (rateLimitedUsers.has(msg.author.id)) {
        tempMessage(msg.channel, `You can run that command in ${moment(rateLimitedUsers.get(msg.author.id)).diff(Date.now(), "seconds")} seconds.`, 5000);
        return;
    }

    if (!msg.member.voiceChannel) return tempMessage(msg.channel, "Join a voice channel first!", 5000);
    const location = voiceLines === voxVoiceLines ? "./vox/" : "./hgrunt/";

    const lines = [location + firstLine];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        let foundLine = false;

        for (let j = 0; j < voiceLines.length; j++) {
            const voiceLine = voiceLines[j];

            if (voiceLine.startsWith(arg.toLowerCase().replace(",", ""))) {
                // found the voice line
                lines.push(location + voiceLine);
                foundLine = true;
                break;
            }
        }

        if (!foundLine) {
            msg.react("❌");
            tempMessage(msg.channel, `I couldn't find the word \`${arg}\` in my word list!`, 5000);
            return;
        }

        if (arg.includes(",")) lines.push("_comma.wav");
    }

    if (lastLine) lines.push(location + lastLine);
    msg.react("👌");
    voice.addLines(msg, lines);

    rateLimitedUsers.set(msg.author.id, Date.now() + 10000);
    setTimeout(() => {
        rateLimitedUsers.delete(msg.author.id);
    }, 10000);
}
