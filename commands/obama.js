const snekfetch = require("snekfetch");
const sleep = require("util").promisify(setTimeout);
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "obama",
    usage: "obama <text>",
    info: "COME AND GET 'EM..... OBAMAAAAAA"
};

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (args.length === 0) {
        const guildSettings = client.guildSettings.get(msg.guild.id);
        return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });
    } else {
        // go and get 'em
        msg.channel.startTyping();
        const words = args.join(" ");
        let request;
        try {
            request = await snekfetch.post("http://talkobamato.me/synthesize.py", { redirect: false }).attach("input_text", words);
        } catch (err) {
            msg.channel.send("Failed to create video! Probably an issue with your input.");
            return msg.channel.stopTyping();
        }
        //console.log(request.headers.location);
        const videoURLBase = `http://talkobamato.me/synth/output/${request.headers.location.split("=")[1]}`;
        const videoURL = `${videoURLBase}/obama.mp4`;
        const videoDoneURL = `${videoURLBase}/video_created.txt`;
        let videoDone = await snekfetch.get(videoDoneURL).catch(() => { });

        while (!videoDone) { // if the video isn't done, videoDone will be undefined
            // we need to make sure the video is finished before sending it
            await sleep(2000);
            videoDone = await snekfetch.get(videoDoneURL).catch(() => { });
        }
        // video should be done now, send it
        msg.channel.send({ files: [videoURL] });
        msg.channel.stopTyping();
    }
};