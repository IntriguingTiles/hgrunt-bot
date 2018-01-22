require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const Cleverbot = require("cleverbot-node");

const cleverbot = new Cleverbot;
cleverbot.configure({ botapi: process.env.CB_KEY });


const client = new Discord.Client({ disableEveryone: true });
client.guildSettings = new Enmap({ provider: new EnmapLevel({ name: "guildSettings" }) });

client.mSent = 0;

const shouldLog = false;

let prefixMention;

const defaultSettings = {
    prefix: "!", // command prefix
    limits: true // should we enable limits
};

client.login(process.env.DISCORD_TOKEN);

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
    const guildSettings = client.guildSettings.get(msg.guild.id);
    
    if (prefixMention.test(msg.content)) {
        if (msg.author.bot && client.mSent >= 100) return;
        if (msg.content.replace(prefixMention, "") === "") return msg.channel.send(`${msg.author} don't even try that gay shit on me`);
        msg.channel.startTyping();
        cleverbot.write(msg.content.replace(prefixMention, ""), response => {
            msg.channel.send(`${msg.author} ${response.output}`).catch(console.error);
            msg.channel.stopTyping();
            if (msg.author.bot) client.mSent++;
        });
        return;
    }
    
    if (msg.author.bot) return;
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

// Bot logging
if (shouldLog) {
    client.on("messageReactionAdd", (reaction, user) => {
        if (reaction.message.guild.id === "154305477323390976") {
            const embed = new Discord.RichEmbed();
            embed.setAuthor(user.tag, user.avatarURL);
            embed.setDescription(`Added a reaction to a message sent by ${reaction.message.author} in ${reaction.message.channel}`);
            if (reaction.message.content) embed.addField("Message", reaction.message.content);
            embed.addField("Emoji", reaction.emoji.toString());
            embed.setColor(0x23D160);
            embed.setFooter(`ID: ${user.id}`);
            embed.setTimestamp();
            client.channels.get("154637540341710848").send({ embed });
        }
    });

    client.on("messageReactionRemove", (reaction, user) => {
        if (reaction.message.guild.id === "154305477323390976") {
            const embed = new Discord.RichEmbed();
            embed.setAuthor(user.tag, user.avatarURL);
            embed.setDescription(`Removed a reaction to a message sent by ${reaction.message.author} in ${reaction.message.channel}`);
            if (reaction.message.content) embed.addField("Message", reaction.message.content);
            embed.addField("Emoji", reaction.emoji.toString());
            embed.setColor(0xFF470F);
            embed.setFooter(`ID: ${user.id}`);
            embed.setTimestamp();
            client.channels.get("154637540341710848").send({ embed });
        }
    });
}

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