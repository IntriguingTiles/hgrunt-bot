const snekfetch = require("snekfetch");
const sleep = require("util").promisify(setTimeout);
const { Client, Message } = require("discord.js"); // eslint-disable-line no-unused-vars

const baseURL = "https://www.aquafreshmessagemaker.com/service/en-gb/api";

let templates = [];

exports.help = {
    name: "aquafresh",
    usage: "aquafresh [template] <text>",
    info: "toothpaste man. To get a list of templates, use !aquafresh list"
};

exports.aliases = ["af"];

/**
 * @param {Client} client
 * @param {Message} msg
 * @param {string[]} args
 */
exports.run = async (client, msg, args) => {
    const guildSettings = client.guildSettings.get(msg.guild.id);

    if (args.length < 1) return msg.channel.send(`Usage: ${guildSettings.prefix}${exports.help.usage}`, { code: "" });

    if (args[0] === "list" && args.length === 1) {
        // print template list
        let final = "Available templates: ```\n";
        templates.forEach(t => final += `${t.filename}\n`);
        final += "```";
        return msg.channel.send(final);
    }

    const m = await msg.channel.send("Generating video (this might take a while)... ");

    // request a token
    const tokenData = await getToken();
    const token = tokenData.body.data;
    // we need cookies for some dumb reason
    const cookies = `laravel_session=${getCookie("laravel_session", tokenData.headers["set-cookie"][1])}; AWSALB=${
        getCookie("AWSALB", tokenData.headers["set-cookie"])}`;

    if (templates.length === 0) {
        templates = await getTemplateList(token, cookies);
    }

    // make video
    let template;

    if (templates.filter(t => t.filename.toLowerCase() === args[0].toLowerCase()).length > 0) {
        template = templates.filter(t => t.filename.toLowerCase() === (args[0].toLowerCase()))[0];
        args.shift();
    } else template = templates[Math.floor(Math.random() * templates.length)];

    const fontSize = getFontSize(args.join(" "));
    try {
        const videoID = await store(token, cookies, args.join(" "), fontSize, template.templateID);

        // now we just need to wait until the video is created
        while (true) { // eslint-disable-line no-constant-condition
            await sleep(5000); // sleep 5 seconds
            const status = await videoStatus(token, cookies, videoID).catch(); // either is nothing or the video url
            if (!status) continue; // video not done yet
            m.delete();
            msg.channel.send(`${msg.author} ${status}`); // video done, send the url
            return;
        }
    } catch (err) {
        m.delete();
        msg.channel.send("Failed to get a video ID. Usually a problem with your input.");
    }
};

async function getToken() {
    // get us a token
    const r = (await snekfetch.get(`${baseURL}/getToken`));
    return r;
}

/**
 * Make the video
 * @param {string} token 
 * @param {string} cookie 
 * @param {string} text 
 * @param {string} fontSize
 * @param {string} templateID 
 */
async function store(token, cookie, text, fontSize, templateID) {
    const videoInfo = (await snekfetch.get(`${baseURL}/get_video/${templateID}`).set(
        { "Content-Type": "application/x-www-form-urlencoded", "x-authorizationtoken": token, cookie })).body.data.video[0];

    const filename = videoInfo.filename;
    const animation = videoInfo.animation;

    const r = (await snekfetch.post(`${baseURL}/store`).set(
        { "Content-Type": "application/x-www-form-urlencoded", "x-authorizationtoken": token, cookie }).send(
            { text, locale: "en-gb", filename, animation, templateID, fontSize })).body;

    if (!r.data.videoID) throw new Error("Didn't get a video ID!");
    return r.data.videoID;
}

/**
 * Get the video status
 * @param {string} token 
 * @param {string} cookie 
 * @param {string} videoID 
 */
async function videoStatus(token, cookie, videoID) {
    const r = (await snekfetch.get(`${baseURL}/video_status/${videoID}`).set(
        { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "x-authorizationtoken": token, cookie })).body;
    if (r.status !== "complete") return;
    if (r.url) return r.url;
}

/**
 * Get an array of all available templates
 * @param {string} token 
 * @param {string} cookie 
 */
async function getTemplateList(token, cookie) {
    const list = [];
    const r = (await snekfetch.get(`${baseURL}/get_videos/en-gb/1`).set(
        { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "x-authorizationtoken": token, cookie })).body;

    for (let i = 1; i <= r.last_page; i++) {
        // build a list of all the available templates
        const templateList = (await snekfetch.get(`${baseURL}/get_videos/en-gb/${i}`).set(
            { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "x-authorizationtoken": token, cookie })).body;
        templateList.data.forEach(t => list.push({ filename: t.filename, templateID: t.templateID }));
    }
    return list;
}

function getFontSize(text) {
    if (text.length < 14) return "200px";
    if (text.length < 31) return "133.33px";
    if (text.length < 57) return "100px";
    if (text.length < 86) return "80px";
    return "66.66px";
}

// definitely not stolen from somewhere. i hate cookies.
function getCookie(cname, cookies) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(cookies);
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}