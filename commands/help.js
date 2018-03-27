const fs = require("fs");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const commands = fs.readdirSync("./commands/");

exports.help = {
    name: "help",
    usage: "help [command]",
    info: "View the commands list or get help on a command"
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    const prefix = client.guildSettings.get(msg.guild.id).prefix;
    if (args.length >= 1) {
        for (let i = 0; i < commands.length; i++) {
            if (commands[i].startsWith(args[0].replace(prefix, "")) && require(`../commands/${commands[i]}`).help) {
                const cmd = require(`../commands/${commands[i]}`);
                let helpText;
                if (cmd.aliases) {
                    helpText = `\`\`\`\nCommand: ${prefix}${cmd.help.name}\nAliases: ${prefix}${cmd.aliases.join(`, ${prefix}`)}\nUsage: ${prefix}${cmd.help.usage}\nInfo: ${cmd.help.info}`;
                } else {
                    helpText = `\`\`\`\nCommand: ${prefix}${cmd.help.name}\nUsage: ${prefix}${cmd.help.usage}\nInfo: ${cmd.help.info}`;
                }

                helpText += "```";
                msg.channel.send(helpText);
                return;
            }
        }

        msg.channel.send("Command not found!");
    } else {
        let final = "Commands list: \n```\n";

        for (let i = 0; i < commands.length; i++) {
            if (require(`../commands/${commands[i]}`).help) {
                final += prefix + commands[i].replace(".js", "") + "\n";
            }
        }
        final += `\`\`\`\nTo get more info about a command, use \`${prefix}help [command]\``;
        msg.channel.send(final);
    }
};