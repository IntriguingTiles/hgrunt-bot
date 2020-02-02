const { Client, Message, GuildMember } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {String[]} args
 */
exports.run = async (client, msg, args) => {
    if (!msg.guild.id === "154305477323390976") return;
    if (!msg.member.hasPermission("KICK_MEMBERS")) return;

    try {
        const member = await fetchMember(client, msg, args);
        if (member.roles.has(msg.guild.roles.find(r => r.name === "Anticitizen").id)) {
            member.removeRole(msg.guild.roles.find(r => r.name === "Anticitizen"), `Unjailed by ${msg.author.tag}.`);
            msg.channel.send("Unjailed!");
        } else {
            member.addRole(msg.guild.roles.find(r => r.name === "Anticitizen"), `Jailed by ${msg.author.tag}.`);
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
            return await msg.guild.members.get(args[0].match(idRegex)[0]);
        } catch (err) { /* I'm cheating */ }
    }
    msg.channel.send("Sorry, I couldn't find that user.");
}