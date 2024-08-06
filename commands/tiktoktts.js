const snekfetch = require("snekfetch");
const { Client, ChatInputCommandInteraction, AutocompleteInteraction } = require("discord.js"); // eslint-disable-line no-unused-vars
const { SlashCommandBuilder } = require("@discordjs/builders");

const voices = [
    { name: "English US - Female 1", value: "en_us_001" },
    { name: "English US - Male 1", value: "en_us_006" },
    { name: "English US - Male 2", value: "en_us_007" },
    { name: "English US - Male 3", value: "en_us_009" },
    { name: "English US - Male 4", value: "en_us_010" },
    { name: "English UK - Male 1", value: "en_uk_001" },
    { name: "English UK - Male 2", value: "en_uk_003" },
    { name: "English AU - Female", value: "en_au_001" },
    { name: "English AU - Male", value: "en_au_002" },
    { name: "French - Male 1", value: "fr_001" },
    { name: "French - Male 2", value: "fr_002" },
    { name: "German - Female", value: "de_001" },
    { name: "German - Male", value: "de_002" },
    { name: "Spanish - Male", value: "es_002" },
    { name: "Spanish MX - Male", value: "es_mx_002" },
    { name: "Indonesian - Female", value: "id_001" },
    { name: "Japanese - Female 1", value: "jp_001" },
    { name: "Japanese - Female 2", value: "jp_003" },
    { name: "Japanese - Female 3", value: "jp_005" },
    { name: "Japanese - Male", value: "jp_006" },
    { name: "Korean - Male 1", value: "kr_002" },
    { name: "Korean - Male 2", value: "kr_004" },
    { name: "Korean - Female", value: "kr_003" },
    { name: "Singing - Alto", value: "en_female_f08_salut_damour" },
    { name: "Singing - Tenor", value: "en_male_m03_lobby" },
    { name: "Singing - Sunshine Soon", value: "en_male_m03_sunshine_soon" },
    { name: "Singing - Warmy Breeze", value: "en_female_f08_warmy_breeze" },
    { name: "Singing - Glorious", value: "en_female_ht_f08_glorious" },
    { name: "Singing - It Goes Up", value: "en_male_sing_funny_it_goes_up" },
    { name: "Singing - Chipmunk", value: "en_male_m2_xhxs_m03_silly" },
    { name: "Singing - Dramatic", value: "en_female_ht_f08_wonderful_world" },
    { name: "Characters - Ghost Face", value: "en_us_ghostface" },
    { name: "Characters - Chewbacca", value: "en_us_chewbacca" },
    { name: "Characters - C3PO", value: "en_us_c3po" },
    { name: "Characters - Stitch", value: "en_us_stitch" },
    { name: "Characters - Stormtrooper", value: "en_us_stormtrooper" },
    { name: "Characters - Rocket", value: "en_us_rocket" },
];

exports.commands = [
    new SlashCommandBuilder()
        .setName("tiktoktts")
        .setDescription("Generates a TikTok TTS MP3 (experimental).")
        .addStringOption(option =>
            option.setName("voice")
                .setDescription("The voice to use.")
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName("text")
                .setDescription("The text for the TTS to say.")
                .setRequired(true)
                .setMaxLength(300))
];

exports.requiredPermissions = ["ATTACH_FILES"];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
    await intr.deferReply({ ephemeral: guildSettings.ephemeral });
    const voice = intr.options.getString("voice");
    const text = intr.options.getString("text");

    if (!voices.some(v => v.value === voice)) {
        intr.editReply("Invalid voice specified.");
        return;
    }

    try {
        const request = await snekfetch.post("https://countik.com/api/text/speech").send({ voice, text });

        if (!request.ok) throw new Error();
        if (!request.body.v_data) throw new Error();

        const audio = Buffer.from(request.body.v_data, "base64");
        intr.editReply({ files: [{ attachment: audio, name: "tiktoktts.mp3" }] });
    } catch (err) {
        intr.editReply("Failed to make TTS audio, probably an issue with your input.");
    }
};

/**
 * 
 * @param {Client} client 
 * @param {AutocompleteInteraction} intr 
 */
exports.autocomplete = async (client, intr) => {
    intr.respond(voices.filter(v => v.name.toLowerCase().startsWith(intr.options.getFocused().toLowerCase())).slice(0, 25));
};