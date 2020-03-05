const translate = require("../utils/translate.js");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

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
exports.run = async (client, msg, args, guildSettings) => {
    const prefix = guildSettings.prefix;
    if (args.length >= 1) {
        const search = args[0].replace(prefix, "");
        for (const command in client.commands) {
            if (command.startsWith(search)) {
                const cmd = client.commands[command];
                if (!cmd.help) continue;
                let helpText;
                if (cmd.aliases) {
                    helpText = `\nCommand: ${prefix}${cmd.help.name}\nAliases: ${prefix}${cmd.aliases.join(`, ${prefix}`)}\nUsage: ${prefix}${cmd.help.usage}\nInfo: ${cmd.help.info}`;
                } else {
                    helpText = `\nCommand: ${prefix}${cmd.help.name}\nUsage: ${prefix}${cmd.help.usage}\nInfo: ${cmd.help.info}`;
                }

                msg.channel.send(await translate(helpText), {code: ""});
                return;
            }
        }

        msg.channel.send(await translate("Command not found!"));
    } else {
        let final = "Commands list: \n```\n";

        for (const command in client.commands) {
            const cmd = client.commands[command];
            if (cmd.help) {
                if (cmd.aliases) {
                    if (command !== cmd.help.name) continue;
                    final += `${prefix}${cmd.help.name} (aliases: ${prefix}${cmd.aliases.join(`, ${prefix}`)})\n`;
                } else {
                    final += `${prefix}${command}\n`;
                }
            }
        }
        final += `\`\`\`\nTo get more info about a command, use \`${prefix}help [command]\``;
        msg.channel.send(final);
    }
};