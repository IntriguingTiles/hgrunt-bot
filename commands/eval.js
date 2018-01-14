/* eslint-disable no-unused-vars*/
const Discord = require("discord.js");
const fs = require("fs");
const { Client, Message } = require("discord.js");

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (msg.author.id !== "221017760111656961") {
        msg.reply(":no_entry: **I! WILL! KICK! YOUR! ASS!** :no_entry:");
        return;
    }

    try {
        const code = args.join(" ");
        let evaled = eval(code);

        if (typeof evaled !== "string")
            evaled = require("util").inspect(evaled);

        msg.channel.send(clean(evaled), { code: "xl" });
    } catch (err) {
        msg.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
};

function clean(text) {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}