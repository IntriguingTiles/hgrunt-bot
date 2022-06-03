const fs = require("fs");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const strips = fs.readdirSync("./gmg");

exports.help = {
    name: "nogf2",
    usage: "nogf2",
    info: "Jon is a broken man"
};

exports.requiredPermissions = ["ATTACH_FILES"];

exports.aliases = ["gmg"];


/**
 * @param {Client} client
 * @param {Message} msg
 */
exports.run = async (client, msg) => {
    const strip = "./gmg/" + strips[Math.floor(Math.random() * strips.length)];

    msg.channel.send({ files: [strip] });
};