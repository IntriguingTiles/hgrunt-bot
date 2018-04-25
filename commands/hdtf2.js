const hdtf = require("../utils/hdtf.js");

exports.help = {
    name: "hdtf2",
    usage: "hdtf2 <text>",
    info: "Generates a HDTF banner"
};

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    if (msg.channel.id === "421798266708164638") return msg.channel.send(":x: That command is disabled here!");
    if (args.length <= 0) return msg.channel.send(`\`\`\`Usage: ${client.guildSettings.get(msg.guild.id).prefix}${exports.help.usage}\`\`\``);

    hdtf(msg, args, "./hdtf/banner2.png");
};