require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const Enmap = require("enmap");
const cleverbot = require("cleverbot-free");
const express = require("express");

const server = express();

const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.GUILD_VOICE_STATES],
    partials: ["MESSAGE", "CHANNEL"]
});

client.guildSettings = new Enmap({
    name: "guildSettings",
    fetchAll: false,
    autoFetch: true,
    cloneLevel: "deep"
});

let cleverbotContexts = new Discord.Collection();

client.mSent = 0;
client.wordsSaid = 0;

let prefixMention;

const defaultSettings = {
    prefix: "!", // command prefix
    limits: true, // should we enable limits
    disabledCommands: [] // array of {command: string, channels: []}. if channels is empty, then the command is disabled for the guild
};

client.login(process.env.DISCORD_TOKEN);

process.on("unhandledRejection", err => {
    console.error(`Unhandled promise rejection!\n${err.stack}`);
    if (client.readyTimestamp) client.users.cache.get("221017760111656961").send(err.stack);
});

client.on("error", console.error);
client.on("warn", console.warn);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.loadCommands();
    client.user.setActivity("!help");
    prefixMention = new RegExp(`^<@!?${client.user.id}> `);
    client.guilds.cache.forEach(guild => guild.members.fetch(guild.ownerId).catch(() => guild.members.fetch(guild.ownerId)));
});

client.on("guildCreate", async guild => {
    client.guildSettings.set(guild.id, defaultSettings);
});

client.on("guildDelete", async guild => {
    client.guildSettings.delete(guild.id);
});

client.on("messageCreate", async msg => {
    if (msg.partial) {
        try {
            msg = await msg.fetch();
        } catch (err) {
            return;
        }
    }

    if (msg.channel.partial) {
        try {
            await msg.channel.fetch();
        } catch (err) {
            return;
        }
    }

    // don't even bother with the messages if we can't type in that channel
    // also check if we're in a dm first because DM channels don't really have permissions
    if (msg.channel.type !== "DM" && !msg.channel.permissionsFor(client.user).has("SEND_MESSAGES")) return;

    if (msg.channel.type === "DM") {
        // since perms remain constant in DM channels and we don't allow !config, we can skip all that stuff
        const args = msg.content.split(" ").slice(1);
        const cmd = msg.content.slice(defaultSettings.prefix.length).split(" ")[0];

        if (cmd in client.commands) {
            if (client.commands[cmd].disabledInDMs) return msg.channel.send("That command is disabled in DMs!");

            client.commands[cmd].uses++;
            client.commands[cmd].run(client, msg, args, defaultSettings).catch(err => {
                console.log(`Error! Command: ${msg.content}\n${err.stack}`);
                const dev = client.users.cache.get("221017760111656961");
                dev.send(`Error! Command: \`${msg.content}\``);
                dev.send(err.stack, { code: "" });
                msg.channel.send(`An error occured while running that command! More info: ${err.message}.`);
            });
            return;
        }
    }

    if (prefixMention.test(msg.content) || (msg.channel.type === "DM" && !msg.author.bot)) {
        // cleverbot stuff
        if (msg.author.bot && client.mSent >= 100) return;

        msg.channel.sendTyping();

        try {
            if (!cleverbotContexts.has(msg.author.id)) cleverbotContexts.set(msg.author.id, []);
            let context = cleverbotContexts.get(msg.author.id);
            if (context.length > 50) context = [];

            const response = await cleverbot(msg.content.replace(prefixMention, ""), context);

            context.push(msg.content.replace(prefixMention, ""), response);

            cleverbotContexts.set(msg.author.id, context);

            if (msg.channel.type !== "DM") msg.channel.send(`${msg.author} ${response}`);
            else msg.channel.send(response);
        } catch (err) {
            msg.channel.send("Failed to get a response!");
        }

        if (msg.author.bot) client.mSent++;
        return;
    }

    if (msg.author.bot) return;

    const guildSettings = client.guildSettings.ensure(msg.guild.id, defaultSettings);

    if (!msg.content.startsWith(guildSettings.prefix)) return;

    const args = msg.content.split(" ").slice(1);
    const cmd = msg.content.slice(guildSettings.prefix.length).split(" ")[0];

    if (cmd in client.commands) {
        // checking permissions
        if (client.commands[cmd].requiredPermissions) {
            const perms = client.commands[cmd].requiredPermissions;
            for (let i = 0; i < perms.length; i++) {
                if (!msg.channel.permissionsFor(client.user).has(perms[i])) return msg.channel.send(`I need permission to \`${perms[i]}\` for that command!`);
            }
        }

        // checking disabled commands
        if (checkDisabledCommands(cmd, guildSettings, msg.channel.id)) return msg.channel.send("That command is disabled!");
        // finally run the command
        // all commands should be async
        client.commands[cmd].uses++;
        client.commands[cmd].run(client, msg, args, guildSettings).catch(err => {
            console.log(`Error! Command: ${msg.content}\n${err.stack}`);
            const dev = client.users.cache.get("221017760111656961");
            dev.send(`Error! Command: \`${msg.content}\``);
            dev.send(err.stack, { code: "" });
            msg.channel.send(`An error occured while running that command! More info: ${err.message}.`);
        });
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
            client.commands[cmd.slice(0, -3)].uses = 0; // let's track command usage!
            cmd = client.commands[cmd.slice(0, -3)];

            if (cmd.init) cmd.init(client);

            if (cmd.aliases) {
                for (let j = 0; j < cmd.aliases.length; j++) {
                    client.commands[cmd.aliases[j]] = cmd;
                }
            }
        }
    }
    console.log(`Loaded ${commands.length} commands!`);
};

function checkDisabledCommands(cmd, guildSettings, channelID) {
    if (guildSettings.disabledCommands.length > 0) {
        for (let i = 0; i < guildSettings.disabledCommands.length; i++) {
            const disabledCommand = guildSettings.disabledCommands[i];

            // remember, the structure for disabledCommand looks like this: {command: string, channels: []}
            // channels can be empty

            if (disabledCommand.channels.length > 0) {
                // this command is disabled in one or more channels
                for (let j = 0; j < disabledCommand.channels.length; j++) {
                    if (disabledCommand.channels[j] !== channelID) continue;

                    if (disabledCommand.command === cmd) return true;

                    if (client.commands[cmd].help) { // all our commands with aliases have help info so we can get the real command name
                        if (disabledCommand.command === client.commands[cmd].help.name) return true;
                    }
                }
            } else {
                // this command is disabled for the guild
                if (disabledCommand.command === cmd) return true;

                if (client.commands[cmd].help) { // all our commands with aliases have help info so we can get the real command name
                    if (disabledCommand.command === client.commands[cmd].help.name) return true;
                }
            }
        }
    }
}

// let's clear out the cleverbot contexts every 15 minutes
setInterval(() => {
    cleverbotContexts = new Discord.Collection();
}, 900000);

process.on("SIGINT", async () => {
    client.guildSettings.close();
    await client.destroy();
    process.exit(0);
});

process.on("message", async msg => {
    if (msg === "shutdown") {
        client.guildSettings.close();
        await client.destroy();
        process.exit(0);
    }
});

// very ugly express inline html stuff below
server.get("/", (req, res) => {
    let final = `<h1>HGrunt Stats</h1>
<p>Speaking in ${client.guilds.cache.size} servers to ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users.<br>
${client.wordsSaid} words spoken.</p>
<h2>Server List</h2>\n<pre>`;
    client.guilds.cache.sort((a, b) => {
        return b.memberCount - a.memberCount;
    }).forEach(guild => final += `${guild.name} (${guild.memberCount} members)\n`);
    final += "</pre><h2>Command Usage</h2>\n<pre>";
    const cmds = [];
    for (const cmd in client.commands) {
        if (client.commands[cmd].aliases && client.commands[cmd].aliases.includes(cmd)) continue;
        cmds.push({ name: cmd, uses: client.commands[cmd].uses });
    }
    cmds.sort((a, b) => {
        return b.uses - a.uses;
    }).forEach(cmd => final += `${cmd.name}: ${cmd.uses} uses\n`);

    res.send(final + "</pre>");
});

server.listen(1337, () => console.log("Started web server on port 1337!"));
