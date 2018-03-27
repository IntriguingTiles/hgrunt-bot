const git = require("simple-git");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 */
exports.run = async (client, msg) => {
    if (msg.author.id !== "221017760111656961") {
        msg.reply(":no_entry: **I! WILL! KICK! YOUR! ASS!** :no_entry:");
        return;
    }

    const statusMsg = await msg.channel.send("Grabbing the latest changes from the repo...");
    git().reset("hard").pull(() => {
        statusMsg.edit("Done!");
        client.loadCommands();
    });
};