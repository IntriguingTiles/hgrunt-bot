require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const Cleverbot = require("cleverbot-node");
const express = require("express");

const server = express();

const cleverbot = new Cleverbot;
cleverbot.configure({ botapi: process.env.CB_KEY });

const client = new Discord.Client({ disableEveryone: true });
client.guildSettings = new Enmap({ provider: new EnmapLevel({ name: "guildSettings" }) });
client.mSent = 0;
client.wordsSaid = 0;

let prefixMention;

const defaultSettings = {
    prefix: "!", // command prefix
    limits: true // should we enable limits
};

client.login(process.env.DISCORD_TOKEN);

process.on("unhandledRejection", err => console.error(`Unhandled promise rejection!\n${err.stack}`));

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
    client.loadCommands();
    client.user.setActivity("!say");
    prefixMention = new RegExp(`^<@!?${client.user.id}> `);
    // now that the prefix could change on a per-guild basis, what do we do here? :thinking:
    // for now, we'll leave it as the default prefix.
});

client.on("guildCreate", async guild => {
    client.guildSettings.set(guild.id, defaultSettings);
});

client.on("guildDelete", async guild => {
    client.guildSettings.delete(guild.id);
});

client.on("message", async msg => {
    if (msg.channel.type !== "text") return; // only do things in a text channel
    if (!msg.channel.permissionsFor(msg.guild.me).has("SEND_MESSAGES")) return;
    
    if (prefixMention.test(msg.content)) {
        if (msg.author.bot && client.mSent >= 100) return;
        msg.channel.startTyping();
        cleverbot.write(msg.content.replace(prefixMention, ""), response => {
            msg.channel.stopTyping();
            msg.channel.send(`${msg.author} ${response.output}`).catch(console.error);
            if (msg.author.bot) client.mSent++;
        });
        return;
    }

    if (msg.author.bot) return;

    const guildSettings = client.guildSettings.get(msg.guild.id);
    if (!msg.content.startsWith(guildSettings.prefix)) return;

    const args = msg.content.split(" ").slice(1);
    const cmd = msg.content.slice(guildSettings.prefix.length).split(" ")[0];

    if (cmd in client.commands) {
        client.commands[cmd].run(client, msg, args);
    }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
    if (newMember.guild.voiceConnection) {
        if (newMember.guild.voiceConnection.channel.members.size === 1) newMember.guild.voiceConnection.channel.leave();
    }
});

client.loadCommands = () => {
    const commands = fs.readdirSync("./commands/");
    client.commands = {};
    for (let i = 0; i < commands.length; i++) {
        let cmd = commands[i];
        if (cmd.match(/\.js$/)) {
            delete require.cache[require.resolve(`./commands/${cmd}`)];
            client.commands[cmd.slice(0, -3)] = require(`./commands/${cmd}`);
            cmd = client.commands[cmd.slice(0, -3)];
            if (cmd.aliases) {
                for (let j = 0; j < cmd.aliases.length; j++) {
                    client.commands[cmd.aliases[j]] = cmd;
                }
            }
        }
    }
    console.log(`Loaded ${commands.length} commands!`);
};

// very ugly express inline html stuff below
server.get("/", (req, res) => {
    let final = `<h1>HGrunt Stats</h1>
<p>Speaking in ${client.guilds.size} servers to ${client.users.size} users.<br>
${client.wordsSaid} words spoken.</p>
<h2>Server List</h2>\n`;
    client.guilds.forEach(guild => final += `${guild.name} owned by ${guild.owner.user.tag} with ${guild.memberCount} members.<br>`);
    res.send(final);
});

server.listen(1337, () => console.log("Started web server on port 1337!"));
