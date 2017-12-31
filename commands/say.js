const fs = require("fs");
const tempMessage = require("../utils/tempmessage.js");
const voice = require("../utils/voice.js");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const hgruntVoiceLines = fs.readdirSync("./hgrunt").reverse();
const voxVoiceLines = fs.readdirSync("./vox");

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (args.length > 0) {
        if (args[0] === "vox") {
            args.shift(); // remove vox from args
            parse(msg, args, voxVoiceLines, "dadeda.wav");
        } else {
            parse(msg, args, hgruntVoiceLines, "clik.wav", "clik.wav");
        }
    } else {
        tempMessage(msg.channel, "You did not provide any words for me to say!", 5000);
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
    if (!msg.member.voiceChannel) return tempMessage(msg.channel, "Join a voice channel first!", 5000);

    const lines = [firstLine];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        let foundLine = false;

        for (let j = 0; j < voiceLines.length; j++) {
            const voiceLine = voiceLines[j];

            if (voiceLine.startsWith(arg.toLowerCase().replace(",", ""))) {
                // found the voice line
                lines.push(voiceLine);
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

    if (lastLine) lines.push(lastLine);
    msg.react("👌");
    voice.addLines(msg, lines);
}
