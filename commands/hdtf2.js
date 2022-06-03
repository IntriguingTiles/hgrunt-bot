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
exports.run = async (client, msg, args, guildSettings) => {
    if (args.length <= 0) return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });

    hdtf(msg, args, "./hdtf/banner2.png");
};