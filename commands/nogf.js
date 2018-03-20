const request = require("request");
const cheerio = require("cheerio");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg) => {
    msg.channel.startTyping();
    request("http://garfield.zweistein.cz/", function (err, response, html) {
        if (!err) {
            const $ = cheerio.load(html);

            const img = "http://garfield.zweistein.cz/" + $("img").first().attr("src");

            msg.channel.send({files: [img]});
            msg.channel.stopTyping();
        } else {
            msg.channel.send("An error has occured!");
            msg.channel.stopTyping();
            console.error(err);
        }
    });
};