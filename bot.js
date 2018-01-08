require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");

const client = new Discord.Client({ disableEveryone: true});
client.guildSettings = new Enmap({provider: new EnmapLevel({name: "guildSettings"})});

const defaultSettings = {
    prefix: "!", // command prefix
    limits: true // should we enable limits
};

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
    client.loadCommands();
    client.user.setGame("!say");
    // now that the prefix could change on a per-guild basis, what do we do here? :thinking:
    // for now, we'll leave it as the default prefix.
});

client.on("guildCreate", async guild => {
    client.guildSettings.set(guild.id, defaultSettings);
});

client.on("message", async msg => {
    const guildSettings = client.guildSettings.get(msg.guild.id);
    if (msg.guild.id === 154305477323390976 && msg.channel.id !== 297518974730764288) return; // only do things in #bot-commands in the HL Discord server
    if (!msg.content.startsWith(guildSettings.prefix)) return;
    if (msg.author.bot) return;
    if (msg.channel.type !== "text") return; // only do things in a text channel

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

process.on("unhandledRejection", err => console.error(`Unhandled promise rejection!\n${err.stack}`));

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