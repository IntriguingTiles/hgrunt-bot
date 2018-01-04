const tempMessage = require("./tempmessage.js");
const { Message, VoiceChannel, Guild } = require("discord.js"); //eslint-disable-line no-unused-vars

exports.queue = new Map();

/**
 * @param {Message} msg 
 * @returns {VoiceChannel}
 */
function getVoiceChannel(msg) {
    const channel = msg.member.voiceChannel;

    if (!channel) {
        tempMessage(msg.channel, "Join a voice channel first!", 5000);
        return;
    }

    const perms = channel.permissionsFor(msg.client.user);

    if (!perms.has("CONNECT")) {
        tempMessage(msg.channel, `I don't have permission to join the voice channel \`${channel.name}\`!`, 5000);
        return;
    }

    if (!perms.has("SPEAK")) {
        tempMessage(msg.channel, `I don't have permission to speak in the voice channel \`${channel.name}\`!`, 5000);
        return;
    }

    if (channel.full && !perms.has("MOVE_MEMBERS")) {
        tempMessage(msg.channel, `The voice channel \`${channel.name}\` is full!`, 5000);
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
            textChannel: msg.channel,
            voiceChannel: msg.member.voiceChannel,
            connection: null,
            lines: [],
        };
        exports.queue.set(msg.guild.id, queueConstruct);

        queueConstruct.lines.push.apply(queueConstruct.lines, lines);

        if (getVoiceChannel(msg)) {
            const connection = await getVoiceChannel(msg).join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.lines[0]);
        } else {
            exports.queue.delete(msg.guild.id);
        }
    } else {
        serverQueue.lines.push.apply(serverQueue.lines, lines);
    }
};

/**
 * @param {Guild} guild 
 * @param {*} line 
 */
function play(guild, line) {
    const serverQueue = exports.queue.get(guild.id);

    if (!line) {
        exports.queue.delete(guild.id);
        return;
    }

    const connection = serverQueue.connection;

    const dispatcher = connection.playFile(`${line}`).on("end", () => {
        serverQueue.lines.shift();
        play(guild, serverQueue.lines[0]);
    });

    dispatcher.setVolume(0.5);
}