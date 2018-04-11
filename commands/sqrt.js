const request = require("request");
const cheerio = require("cheerio");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "sqrt",
    usage: "sqrt [latest] [YYYY-MM-DD]",
    info: "Square Root of Minus Garfield"
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();

    let url = "http://www.mezzacotta.net";

    if (args.length === 0) {
        url += "/garfield/?comic=0"; // 0 -> random
        sendComic(url, msg);
    } else if (args[0].startsWith("l")) {
        url += "/garfield/"; // no args -> latest
        sendComic(url, msg);
    } else {
        request("http://www.mezzacotta.net/garfield/archive.php", function (err, response, html) {
            if (!err) {
                const $ = cheerio.load(html);
                const comic = $("a").filter(function () { return $(this).text().trim() === args[0]; }).first().attr("href"); //eslint-disable-line brace-style
                if (!comic) {
                    msg.channel.send("No comic was found for `" + args[0] + "` - check the date format (YYYY-MM-DD)");
                    msg.channel.stopTyping();
                    return;
                }
                url += comic;
                sendComic(url, msg);
            } else {
                msg.channel.send("An error has occured!");
                msg.channel.stopTyping();
                console.error(err);
                return;
            }
        });
    }
};

function sendComic(url, msg) {
    request(url, function (err, response, html) {
        if (!err) {
            const $ = cheerio.load(html);

            const img = "http://www.mezzacotta.net/" + $("img").eq(1).attr("src");

            msg.channel.send({ files: [img] });
            msg.channel.stopTyping();
        } else {
            msg.channel.send("An error has occured!");
            msg.channel.stopTyping();
            console.error(err);
        }
    });
}
