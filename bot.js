require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const prefix = "!";

const client = new Discord.Client({ disableEveryone: true});

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
    client.loadCommands();
    client.user.setGame(`${prefix}say`);
});

client.on("message", async msg => {
    if (!msg.content.startsWith(prefix)) return;
    if (msg.author.bot) return;
    if (msg.channel.type !== "text") return;

    const args = msg.content.split(" ").slice(1);
    const cmd = msg.content.slice(prefix.length).split(" ")[0];

    if (cmd in client.commands) {
        client.commands[cmd].run(client, msg, args);
    }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
    if (newMember.guild.voiceConnection) {
        if (newMember.guild.voiceConnection.channel.members.size) newMember.guild.voiceConnection.channel.leave();
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