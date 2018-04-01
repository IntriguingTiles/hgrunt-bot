const request = require("request");
const cheerio = require("cheerio");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "nogf",
    usage: "nogf",
    info: "Jon is a broken man"
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();

    if (args[0]) {
        msg.channel.send({ files: ["./nogf.png"]});
        msg.channel.stopTyping();
        return;
    }

    request("http://garfield.zweistein.cz/", function (err, response, html) {
        if (!err) {
            const $ = cheerio.load(html);

            const img = "http://garfield.zweistein.cz/" + $("img").first().attr("src");

            msg.channel.send({ files: [img] });
            msg.channel.stopTyping();
        } else {
            msg.channel.send("An error has occured!");
            msg.channel.stopTyping();
            console.error(err);
        }
    });
};