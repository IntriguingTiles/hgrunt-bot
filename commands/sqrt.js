const request = require("request");
const cheerio = require("cheerio");
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

exports.help = {
    name: "sqrt",
    usage: "sqrt [latest] [YYYY-MM-DD]",
    info: "this half life bot needs more garfield commands"
};

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    msg.channel.startTyping();

    var url = "http://www.mezzacotta.net";
    function next() {
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
    if (args.length === 0) {
        url += "/garfield/?comic=0"; // 0 -> random
        next();
    } else if (args[0] === "latest") {
        url += "/garfield/"; // no args -> latest
        next();
    } else {
        request("http://www.mezzacotta.net/garfield/archive.php", function (err, response, html) {
            if (!err) {
                const $ = cheerio.load(html);
                const comic = $("a").filter(function() { return $(this).text().trim() === args[0]; }).first().attr("href");
                if (comic === undefined) {
                    msg.channel.send("No comic was found for " + args[0] + " - check the date format (YYYY-MM-DD)");
                    msg.channel.stopTyping();
                    return;
                }
                url += comic;
                next();
            } else {
                msg.channel.send("An error has occured!");
                msg.channel.stopTyping();
                console.error(err);
                return;
            }
        });
    }
};
