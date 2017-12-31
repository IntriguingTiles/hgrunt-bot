const fs = require("fs");
const tempMessage = require("../utils/tempmessage.js");
const voice = require("../utils/voice.js");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const voiceLines = fs.readdirSync("./hgrunt").reverse();

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (args.length > 0) {
        const lines = ["clik.wav"];

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
        lines.push("clik.wav");
        msg.react("👌");
        voice.addLines(msg, lines);
    } else {
        tempMessage(msg.channel, "You did not provide any words!", 5000);
    }
};
