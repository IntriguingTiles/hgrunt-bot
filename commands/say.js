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
    const guildSettings = client.guildSettings.get(msg.guild.id);
    const shouldLimit = guildSettings.limits;
    if (shouldLimit && args.length >= 20) {
        msg.react("❌");
        msg.channel.send(`Too many words! If you have the \`Manage Server\` permission, use ${guildSettings.prefix}limits to disable the limits.`);
    }
    if (args.length > 0) {
        if (args[0] === "vox") {
            if (args.length < 2) return tempMessage(msg.channel, "```Usage: !say [vox] <words>```", 5000);
            args.shift(); // remove vox from args
            parse(msg, args, guildSettings, voxVoiceLines, "dadeda.wav");
        } else {
            parse(msg, args, guildSettings, hgruntVoiceLines, "clik.wav", "clik.wav");
        }
    } else {
        tempMessage(msg.channel, "```Usage: !say [vox] <words>```", 5000);
    }
};

/**
 * @param {Message} msg
 * @param {string[]} args 
 * @param {string[]} voiceLines 
 * @param {string} firstLine 
 * @param {string} lastLine 
 */
function parse(msg, args, guildSettings, voiceLines, firstLine, lastLine) {
    const shouldLimit = guildSettings.limits;
    if (rateLimitedUsers.has(msg.author.id)) {
        tempMessage(msg.channel, `You can run that command in ${moment(rateLimitedUsers.get(msg.author.id)).diff(Date.now(), "seconds")} seconds.`, 5000);
        return;
    }

    if (!msg.member.voiceChannel) return msg.channel.send("Join a voice channel first!");
    const location = voiceLines === voxVoiceLines ? "./vox/" : "./hgrunt/";

    const lines = [location + firstLine];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        let foundLine = false;

        if (shouldLimit && args.filter(item => item.replace("!", "").replace(",", "").replace(".", "").toLowerCase() === arg.replace("!", "").replace(",", "").replace(".").toLowerCase()).length > 3) {
            msg.react("❌");
            msg.channel.send(`You used the word \`${arg}\` too many times! If you have the \`Manage Server\` permission, use ${guildSettings.prefix}limits to disable the limits.`);
            return;
        }

        for (let j = 0; j < voiceLines.length; j++) {
            const voiceLine = voiceLines[j];

            if (voiceLine.startsWith(arg.toLowerCase().replace(",", "").replace(".", ""))) {
                // found the voice line
                lines.push(location + voiceLine);
                foundLine = true;
                break;
            }
        }

        if (!foundLine) {
            msg.react("❌");
            msg.channel.send(`I couldn't find the word \`${arg}\` in my word list!`);
            if (location === "./vox/") fs.appendFile("./no_line.txt", `\n${arg}`, () => { });
            return;
        }

        if (arg.includes(",")) lines.push("_comma.wav");
        if (arg.includes(".")) lines.push("_period.wav");
    }

    if (lastLine) lines.push(location + lastLine);
    msg.client.wordsSaid += args.length;
    msg.react("👌");
    voice.addLines(msg, lines);

    rateLimitedUsers.set(msg.author.id, Date.now() + 10000);
    setTimeout(() => {
        rateLimitedUsers.delete(msg.author.id);
    }, 10000);
}
