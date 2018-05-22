require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const Enmap = require("enmap");
const EnmapLevel = require("enmap-level");
const Cleverbot = require("./utils/cleverbot.js");
const express = require("express");
const sleep = require("util").promisify(setTimeout);

const server = express();

const cleverbot = new Cleverbot(process.env.CB_USER, process.env.CB_KEY);

const client = new Discord.Client({ disableEveryone: true });
client.guildSettings = new Enmap({ provider: new EnmapLevel({ name: "guildSettings" }) });
client.mSent = 0;
client.wordsSaid = 0;

let prefixMention;

const defaultSettings = {
    prefix: "!", // command prefix
    limits: true, // should we enable limits
    disabledCommands: [] // array of {command: string, channels: []}. if channels is empty, then the command is disabled for the guild
};

client.login(process.env.DISCORD_TOKEN);

process.on("unhandledRejection", err => console.error(`Unhandled promise rejection!\n${err.stack}`));

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
    client.loadCommands();
    client.user.setActivity("!help");
    prefixMention = new RegExp(`^<@!?${client.user.id}> `);
});

client.on("guildBanAdd", async (guild, user) => {
    if (guild.id !== "154305477323390976") return;
    await sleep(3000);
    const auditLog = (await guild.fetchAuditLogs()).entries.first(); // potential race condition here
    // waiting a second or so should prevent it from ever happening, if it even can happen.

    if (auditLog.action !== "MEMBER_BAN_ADD") {
        client.users.get("221017760111656961").send(`Something happened! We should've gotten the audit log for ${user}'s ban but we got the audit log for ${auditLog.action} instead!`);
        return;
    }

    if (auditLog.target.id !== user.id) {
        client.users.get("221017760111656961").send(`Something happened! We should've gotten the audit log for ${user} but we got the audit log for ${auditLog.target} instead!`);
        return;
    }

    if (auditLog.executor.id === "155149108183695360") return;

    const embed = new Discord.RichEmbed();
    embed.setAuthor("Member Banned", user.displayAvatarURL);
    embed.setThumbnail(user.displayAvatarURL);
    embed.setColor(0xFF470F);
    embed.addField("Member", `${user} ${Discord.Util.escapeMarkdown(user.tag)}`, true);
    embed.addField("Banned by", `${auditLog.executor} ${Discord.Util.escapeMarkdown(auditLog.executor.tag)}`, true);
    if (auditLog.reason) embed.addField("Reason", auditLog.reason);
    embed.setTimestamp(auditLog.createdAt);
    embed.setFooter(`ID: ${user.id}`);

    client.channels.get("154637540341710848").send({ embed });
});

client.on("guildMemberRemove", async member => {
    if (member.guild.id !== "154305477323390976") return;
    await sleep(3000);
    const auditLog = (await member.guild.fetchAuditLogs()).entries.first(); // potential race condition here

    if (auditLog.action !== "MEMBER_KICK") return;

    if (auditLog.target.id !== member.user.id) return;

    const embed = new Discord.RichEmbed();
    embed.setAuthor("Member Kicked", member.user.displayAvatarURL);
    embed.setThumbnail(member.user.displayAvatarURL);
    embed.setColor(0xFF470F);
    embed.addField("Member", `${member.user} ${Discord.Util.escapeMarkdown(member.user.tag)}`, true);
    embed.addField("Kicked by", `${auditLog.executor} ${Discord.Util.escapeMarkdown(auditLog.executor.tag)}`, true);
    if (auditLog.reason) embed.addField("Reason", auditLog.reason);
    embed.setTimestamp(auditLog.createdAt);
    embed.setFooter(`ID: ${member.user.id}`);

    client.channels.get("154637540341710848").send({ embed });
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
        try {
            const response = await cleverbot.ask(msg.content.replace(prefixMention, ""));
            
            msg.channel.send(`${msg.author} ${response}`);
            msg.channel.stopTyping();
        } catch (err) {
            msg.channel.send("Failed to get a response!");
            msg.channel.stopTyping();
        }

        if (msg.author.bot) client.mSent++;
        return;
    }

    if (msg.author.bot) return;

    let guildSettings = client.guildSettings.get(msg.guild.id);

    if (!guildSettings) {
        client.guildSettings.set(msg.guild.id, defaultSettings);
        guildSettings = client.guildSettings.get(msg.guild.id);
    }

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
        if (guildSettings.disabledCommands.length > 0) {
            for (let i = 0; i < guildSettings.disabledCommands.length; i++) {
                const disabledCommand = guildSettings.disabledCommands[i];

                // remember, the structure for disabledCommand looks like this: {command: string, channels: []}
                // channels can be empty

                if (disabledCommand.channels.length > 0) {
                    // this command is disabled in one or more channels
                    for (let j = 0; j < disabledCommand.channels.length; j++) {
                        if (disabledCommand.channels[j] !== msg.channel.id) continue;

                        if (disabledCommand.command === cmd) return msg.channel.send("That command is disabled in this channel!");

                        if (client.commands[cmd].help) { // all our commands with aliases have help info so we can get the real command name
                            if (disabledCommand.command === client.commands[cmd].help.name) return msg.channel.send("That command is disabled in this channel!");
                        }
                    }
                } else {
                    // this command is disabled for the guild
                    if (disabledCommand.command === cmd) return msg.channel.send("That command is disabled!");

                    if (client.commands[cmd].help) { // all our commands with aliases have help info so we can get the real command name
                        if (disabledCommand.command === client.commands[cmd].help.name) return msg.channel.send("That command is disabled!");
                    }
                }
            }
        }

        // finally run the command
        client.commands[cmd].run(client, msg, args);
    }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
    if (newMember.guild.voiceConnection) {
        if (newMember.guild.voiceConnection.channel.members.size === 1 && newMember.guild.voiceConnection.channel.members.first() === newMember.guild.me) newMember.guild.voiceConnection.channel.leave();
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

process.on("SIGINT", async () => {
    client.guildSettings.db.close();
    await client.destroy();
    process.exit(0);
});

// very ugly express inline html stuff below
server.get("/", (req, res) => {
    let final = `<h1>HGrunt Stats</h1>
<p>Speaking in ${client.guilds.size} servers to ${client.users.size} users.<br>
${client.wordsSaid} words spoken.</p>
<h2>Server List</h2>\n<pre>`;
    client.guilds.sort((a, b) => {
        return b.memberCount - a.memberCount;
    }).forEach(guild => final += `${guild.name} owned by ${guild.owner.user.tag} (${guild.memberCount} members)\n`);
    res.send(final + "</pre>");
});

server.listen(1337, () => console.log("Started web server on port 1337!"));