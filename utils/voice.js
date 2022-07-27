const { Client, ChatInputCommandInteraction, VoiceChannel, Guild } = require("discord.js"); //eslint-disable-line no-unused-vars
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

/**
 * 
 * @param {Client} client 
 */
exports.init = client => {
    client.on("voiceStateUpdate", (oldState, newState) => {
        if (exports.queue.has(newState.guild.id) && !newState.guild.members.me.voice.channel) {
            exports.queue.get(newState.guild.id)?.connection?.destroy();
            exports.queue.delete(newState.guild.id);
        }

        if (newState.guild.members.me.voice.channel && newState.guild.members.me.voice.channel.members.filter(m => !m.user.bot).size === 0) {
            // disconnect after 10 seconds if nobody returns
            setTimeout(() => {
                const guild = client.guilds.cache.get(newState.guild.id);
                if (guild.members.me.voice.channel && guild.members.me.voice.channel.members.filter(m => !m.user.bot).size === 0) {
                    // still zero, bye bye
                    exports.queue.get(guild.id)?.connection?.destroy();
                    exports.queue.delete(guild.id);
                }
            }, 10000);
        }
    });
};

/**
 * @param {ChatInputCommandInteraction} intr 
 * @returns {VoiceChannel}
 */
function getVoiceChannel(intr) {
    if (intr.guild.members.me.voice.channel && exports.queue.get(intr.guild.id).connection) return intr.guild.members.me.voice.channel;

    const channel = intr.member.voice.channel;

    if (!channel) {
        intr.reply({ content: "Join a voice channel first!", ephemeral: true });
        return;
    }

    if (!channel.joinable) {
        if (channel.full) {
            intr.reply({ content: `The voice channel \`${channel.name}\` is full!`, ephemeral: true });
        } else {
            intr.reply({ content: `I don't have permission to join the voice channel \`${channel.name}\`!`, ephemeral: true });
        }
        return;
    }

    if (!channel.speakable) {
        intr.reply({ content: `I don't have permission to speak in the voice channel \`${channel.name}\`!`, ephemeral: true });
        return;
    }

    return channel;
}

/**
 * @param {ChatInputCommandInteraction} intr 
 * @param {string[]} lines 
 */
exports.addLines = async (intr, lines) => {
    let serverQueue = exports.queue.get(intr.guild.id);

    if (!serverQueue) {
        serverQueue = {
            voiceChannel: intr.member.voice.channel,
            connection: null,
            player: createAudioPlayer(),
            lines: [],
            timeout: 0
        };

        exports.queue.set(intr.guild.id, serverQueue);
        serverQueue.lines.push.apply(serverQueue.lines, lines);

        const channel = getVoiceChannel(intr);

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
                            exports.queue.get(intr.guild.id)?.connection?.destroy();
                            exports.queue.delete(intr.guild.id);
                        }, 300000);

                        return;
                    }

                    play(intr.guild, serverQueue.lines[0]);
                });

                play(intr.guild, serverQueue.lines[0]);
            } catch (err) {
                intr.reply({ content: "I couldn't join the voice chat for some reason.", ephemeral: true });
                console.error(err);
                exports.queue.get(intr.guild.id)?.connection?.destroy();
                exports.queue.delete(intr.guild.id);
                throw "Couldn't join VC";
            }
        } else {
            exports.queue.get(intr.guild.id)?.connection?.destroy();
            exports.queue.delete(intr.guild.id);
            throw "Couldn't join VC";
        }
    } else {
        if (!intr.guild.members.me.voice) {
            exports.queue.get(intr.guild.id)?.connection?.destroy();
            exports.queue.delete(intr.guild.id);
            this.addLines(intr, lines);
            return;
        }

        serverQueue.lines.push.apply(serverQueue.lines, lines);

        if (serverQueue.player.state !== AudioPlayerStatus.Playing) {
            play(intr.guild, exports.queue.get(intr.guild.id).lines[0]);
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