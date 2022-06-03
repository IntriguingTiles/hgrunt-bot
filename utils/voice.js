const tempMessage = require("./tempmessage.js");
const { Message, VoiceChannel, Guild } = require("discord.js"); //eslint-disable-line no-unused-vars
const { joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    AudioPlayer, //eslint-disable-line no-unused-vars
    VoiceConnection, //eslint-disable-line no-unused-vars
    VoiceConnectionStatus,
    StreamType,
    AudioPlayerStatus } = require("@discordjs/voice");


/**
 * @typedef {Object} Queue
 * @property {VoiceChannel} voiceChannel
 * @property {VoiceConnection} connection
 * @property {AudioPlayer} player
 * @property {string[]} lines
 * @property {number} timeout
 */

/**
 * @type Map<string, Queue>
 */
exports.queue = new Map();

exports.init = client => {
    client.on("voiceStateUpdate", (oldState, newState) => {
        if (newState.guild.me.voice.channel && newState.guild.me.voice.channel.members.filter(m => !m.user.bot).size === 0) {
            // disconnect after 10 seconds if nobody returns
            setTimeout(() => {
                const guild = client.guilds.cache.get(newState.guild.id);
                if (guild.me.voice.channel && guild.me.voice.channel.members.filter(m => !m.user.bot).size === 0) {
                    // still zero, bye bye
                    exports.queue.get(guild.id)?.connection?.destroy();
                    exports.queue.delete(guild.id);
                }
            }, 10000);
        }
    });
};

/**
 * @param {Message} msg 
 * @returns {VoiceChannel}
 */
function getVoiceChannel(msg) {
    if (msg.guild.me.voice && exports.queue.get(msg.guild.id).connection) return msg.guild.me.voice.channel;

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
    let serverQueue = exports.queue.get(msg.guild.id);

    if (!serverQueue) {
        serverQueue = {
            voiceChannel: msg.member.voice.channel,
            connection: null,
            player: createAudioPlayer(),
            lines: [],
            timeout: 0
        };

        exports.queue.set(msg.guild.id, serverQueue);
        serverQueue.lines.push.apply(serverQueue.lines, lines);

        const channel = getVoiceChannel(msg);

        if (channel) {
            try {
                serverQueue.connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guildId,
                    adapterCreator: channel.guild.voiceAdapterCreator
                });

                await entersState(serverQueue.connection, VoiceConnectionStatus.Ready, 30000);

                serverQueue.connection.subscribe(serverQueue.player);
                serverQueue.player.on(AudioPlayerStatus.Idle, async () => {
                    // advance the queue
                    serverQueue.lines.shift();

                    // clear the inactivity timeout
                    clearTimeout(serverQueue.timeout);

                    if (serverQueue.lines.length === 0) {
                        // no lines in the queue, leave after 5 minutes of inactivity
                        serverQueue.timeout = setTimeout(() => {
                            exports.queue.get(msg.guild.id)?.connection?.destroy();
                            exports.queue.delete(msg.guild.id);
                        }, 30000);

                        return;
                    }

                    play(msg.guild, serverQueue.lines[0]);
                });

                play(msg.guild, serverQueue.lines[0]);
            } catch (err) {
                msg.channel.send("I couldn't join the voice chat for some reason.");
                console.error(err);
                exports.queue.get(msg.guild.id)?.connection?.destroy();
                exports.queue.delete(msg.guild.id);
            }
        } else {
            exports.queue.get(msg.guild.id)?.connection?.destroy();
            exports.queue.delete(msg.guild.id);
        }
    } else {
        if (!msg.guild.me.voice) {
            exports.queue.get(msg.guild.id)?.connection?.destroy();
            exports.queue.delete(msg.guild.id);
            this.addLines(msg, lines);
            return;
        }

        serverQueue.lines.push.apply(serverQueue.lines, lines);

        if (serverQueue.player.state !== AudioPlayerStatus.Playing) {
            play(msg.guild, exports.queue.get(msg.guild.id).lines[0]);
        }
    }
};

/**
 * @param {Guild} guild 
 * @param {*} line 
 */
function play(guild, line) {
    const player = exports.queue.get(guild.id).player;
    const resource = createAudioResource(line, { inputType: StreamType.Arbitrary });

    player.play(resource);
}