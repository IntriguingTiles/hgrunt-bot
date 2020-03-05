const { Client, Message, GuildMember } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.aliases = ["unjail"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {String[]} args
 */
exports.run = async (client, msg, args, guildSettings) => {
    if (msg.guild.id !== "154305477323390976") return;
    if (!msg.member.hasPermission("KICK_MEMBERS")) return;

    if (args.length === 0) return msg.channel.send(`${guildSettings.prefix}jail <@mention or id>`, { code: "" });

    try {
        const member = await fetchMember(client, msg, args);
        if (member.roles.cache.has(msg.guild.roles.cache.find(r => r.name === "Anticitizen").id)) {
            member.roles.remove(msg.guild.roles.cache.find(r => r.name === "Anticitizen"), `Unjailed by ${msg.author.tag}.`);
            msg.channel.send("Unjailed!");
        } else {
            member.roles.add(msg.guild.roles.cache.find(r => r.name === "Anticitizen"), `Jailed by ${msg.author.tag}.`);
            msg.channel.send("Jailed!");
        }
    } catch (err) {
        msg.channel.send("Failed to add the Anticitizen role!");
    }
};

/**
 * @param {Client} client 
 * @param {Message} msg 
 * @param {String[]} args
 * @returns {GuildMember}
 */
async function fetchMember(client, msg, args) {
    if (msg.mentions.users.size !== 0) return msg.mentions.members.first();// mentions
    const idRegex = /[0-9]+/g;

    if (idRegex.test(args[0])) {
        try {
            return await msg.guild.members.fetch(args[0].match(idRegex)[0]);
        } catch (err) { /* I'm cheating */ }
    }
    msg.channel.send("Sorry, I couldn't find that user.");
}