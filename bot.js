require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const Enmap = require("enmap");

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Discord.Partials.Channel, Discord.Partials.Message]
});

client.guildSettings = new Enmap({
    name: "guildSettings",
    fetchAll: false,
    autoFetch: true,
    cloneLevel: "deep"
});

client.wordsSaid = 0;

const defaultSettings = {
    limits: true, // should we enable limits
    ephemeral: false // should interactions only be ephemeral
};

client.login(process.env.DISCORD_TOKEN);

process.on("unhandledRejection", err => {
    console.error(`Unhandled promise rejection!\n${err.stack}`);
    if (client.isReady() && !err.name.includes("AbortError") && client.user.id === "396884008501510144") client.users.cache.get("221017760111656961").send(err.stack);
});

client.on("error", console.error);
client.on("warn", console.warn);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    if (client.user.id !== "396884008501510144") {
        console.log("Running in development mode, slash commands will be registered per-guild");
    } else {
        console.log("Running in production mode, slash commands will be registered globally");
    }

    client.loadCommands();
    client.user.setActivity("with slash commands");
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
    if (msg.channel.type !== Discord.ChannelType.DM && !msg.channel.permissionsFor(client.user)?.has(Discord.PermissionFlagsBits.SendMessages)) return;
});

// slash commands
client.on("interactionCreate", async intr => {
    if (!intr.isChatInputCommand() && !intr.isContextMenuCommand()) return;
    const cmd = intr.commandName;
    if (!(cmd in client.commands)) return;

    let guildSettings;

    if (intr.inGuild()) {
        guildSettings = client.guildSettings.ensure(intr.guild.id, defaultSettings);
    } else {
        guildSettings = defaultSettings;
    }

    client.commands[cmd].run(client, intr, guildSettings);
});

// autocomplete
client.on("interactionCreate", async intr => {
    if (intr.type !== Discord.InteractionType.ApplicationCommandAutocomplete) return;
    const cmd = intr.commandName;
    if (!(cmd in client.commands)) return;

    client.commands[cmd].autocomplete(client, intr);
});

client.loadCommands = () => {
    const commands = fs.readdirSync("./commands/");
    client.commands = {};
    for (let i = 0; i < commands.length; i++) {
        let cmd = commands[i];
        if (cmd.match(/\.js$/)) {
            delete require.cache[require.resolve(`./commands/${cmd}`)];
            cmd = require(`./commands/${cmd}`);

            if (cmd.init) cmd.init(client);

            if (cmd.commands) {
                for (let j = 0; j < cmd.commands.length; j++) {
                    client.commands[cmd.commands[j].name] = cmd;

                    if (client.user.id !== "396884008501510144") {
                        client.guilds.cache.forEach(async guild => {
                            await client.application.commands.create(cmd.commands[j].toJSON(), guild.id);
                        });
                    } else {
                        client.application.commands.create(cmd.commands[j].toJSON());
                    }
                }

                if (cmd.aliases) {
                    for (let j = 0; j < cmd.aliases.length; j++) {
                        client.commands[cmd.aliases[j]] = cmd;
                        const oldName = cmd.commands[j].name;
                        cmd.commands[j].setName(cmd.aliases[j]);

                        if (client.user.id !== "396884008501510144") {
                            client.guilds.cache.forEach(async guild => {
                                await client.application.commands.create(cmd.commands[j].toJSON(), guild.id);
                            });
                        } else {
                            client.application.commands.create(cmd.commands[j].toJSON());
                        }

                        cmd.commands[j].setName(oldName);
                    }
                }
            } else {
                // eval is the only command without slash command support
                client.commands["eval"] = cmd;
            }
        }
    }
    console.log(`Loaded ${commands.length} commands!`);
};

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