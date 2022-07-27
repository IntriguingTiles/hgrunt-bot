const snekfetch = require("snekfetch");
const cheerio = require("cheerio");
const { Client, ChatInputCommandInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");

exports.commands = [
    new SlashCommandBuilder()
        .setName("wikihow")
        .setDescription("View articles from wikiHow.")
        .addStringOption(option =>
            option.setName("search")
                .setDescription("The article to search for."))
];

exports.requiredPermissions = ["EMBED_LINKS"];

exports.aliases = ["wh"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    const search = intr.options.getString("search", false);

    if (search) {
        // use the mediawiki api to search for an article
        const encSearch = encodeURIComponent(search);
        const results = (await snekfetch.get(`https://www.wikihow.com/api.php?action=titlesearch&q=${encSearch}&safeSearch=0&format=json`)).body; // gives us json we can work with

        if (!results.data[0]) {
            intr.reply({ content: `No results found for \`${search}\`!`, ephemeral: true });
            return;
        }

        sendArticle(intr, results.data[0].url, guildSettings);
    } else {
        // random
        sendArticle(intr, "https://www.wikihow.com/Special:Randomizer", guildSettings);
    }
};

/**
 * @param {ChatInputCommandInteraction} intr 
 * @param {string} article 
 */
async function sendArticle(intr, article, guildSettings) {
    for (let i = 0; i < 5; i++) {
        try {
            const html = (await snekfetch.get(article)).body;
            const $ = cheerio.load(html);

            // we can get the data we need from things in <head>
            const title = $("meta[property='og:title']").attr("content");
            const url = $("meta[property='og:url']").attr("content");
            const img = $("meta[property='og:image']").attr("content");
            const description = $("meta[property='og:description']").attr("content");

            // time to send it as an embed
            const embed = new EmbedBuilder();
            embed.setAuthor({ name: "wikiHow", iconURL: "https://www.wikihow.com/skins/WikiHow/wH-initials_152x152.png" });
            embed.setTitle(title);
            embed.setURL(url);
            embed.setColor(0x93B874);
            embed.setDescription(description);
            embed.setImage(img);
            intr.reply({ embeds: [embed], ephemeral: guildSettings.ephemeral });
            return;
        } catch (err) {
            //
        }
    }

    intr.reply({ content: "Failed to find article.", ephemeral: true });
}