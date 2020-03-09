const tempMessage = require("./tempmessage.js");
const { Message, VoiceChannel, Guild } = require("discord.js"); //eslint-disable-line no-unused-vars

exports.queue = new Map();

/**
 * @param {Message} msg 
 * @returns {VoiceChannel}
 */
function getVoiceChannel(msg) {
    if (msg.guild.voice && msg.guild.voice.connection) return msg.guild.voice.channel;

    const channel = msg.member.voice.channel;

    if (!channel) {
        tempMessage(msg.channel, "Join a voice channel first!", 5000);
        return;
    }

    if (!channel.joinable) {
        if (channel.full) {
            tempMessage(msg.channel, `The voice channel \`${channel.name}\` is full!`, 5000);
        } else {
            tempMessage(msg.channel, `I don't have permission to join the voice channel \`${channel.name}\`!`, 5000);
        }
        return;
    }

    if (!channel.speakable) {
        tempMessage(msg.channel, `I don't have permission to speak in the voice channel \`${channel.name}\`!`, 5000);
        return;
    }

    return channel;
}

/**
 * @param {Message} msg 
 * @param {string[]} lines 
 */
exports.addLines = async (msg, lines) => {
    const serverQueue = exports.queue.get(msg.guild.id);

    if (!serverQueue) {
        const queueConstruct = {
            voiceChannel: msg.member.voice.channel,
            connection: null,
            lines: [],
        };
        exports.queue.set(msg.guild.id, queueConstruct);

        queueConstruct.lines.push.apply(queueConstruct.lines, lines);

        if (getVoiceChannel(msg)) {
            let connection;

            if (getVoiceChannel(msg).connection) connection = getVoiceChannel(msg).connection;
            else {
                try {
                    connection = await getVoiceChannel(msg).join();
                    connection.on("error", console.error);
                } catch (err) {
                    msg.channel.send(`Failed to join the voice channel \`${getVoiceChannel(msg).name}\`!`);
                    return;
                }
            }

            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.lines[0]);
        } else {
            exports.queue.delete(msg.guild.id);
        }
    } else {
        if (!msg.guild.voice.connection) {
            exports.queue.delete(msg.guild.id);
            this.addLines(msg, lines);
            return;
        }
        serverQueue.lines.push.apply(serverQueue.lines, lines);
    }
};

/**
 * @param {Guild} guild 
 * @param {*} line 
 */
function play(guild, line) {
    const serverQueue = exports.queue.get(guild.id);

    const connection = serverQueue.connection;

    connection.play(`${line}`, { volume: 0.5 }).on("speaking", speaking => {
        if (!speaking) {
            // we're no longer speaking, next line please
            serverQueue.lines.shift();

            if (serverQueue.lines.length === 0) {
                exports.queue.delete(guild.id);
                return;
            }

            play(guild, serverQueue.lines[0]);
        }
    });
}