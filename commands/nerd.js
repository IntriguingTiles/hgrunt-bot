const { Client, ChatInputCommandInteraction } = require("discord.js");  // eslint-disable-line no-unused-vars
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require("@discordjs/builders");
const { createCanvas, loadImage } = require("canvas");
const { ApplicationCommandType } = require("discord-api-types/v9");

exports.commands = [
	new SlashCommandBuilder()
		.setName("nerd")
		.setDescription("Edit text onto the nerd speech bubble image.")
		.addStringOption(option =>
			option.setName("text")
				.setDescription("The text that will be edited onto the nerd image.")
				.setRequired(true)),
	new ContextMenuCommandBuilder()
		.setName("Nerd")
		.setType(ApplicationCommandType.Message)
];

/**
 * @param {Client} client
 * @param {ChatInputCommandInteraction} intr
 */
exports.run = async (client, intr, guildSettings) => {
	let text;

	if (intr.isContextMenuCommand()) {
		text = intr.options.getMessage("message").cleanContent;
	} else {
		text = intr.options.getString("text");
	}

	intr.reply({ files: [await generateNerd(text.substring(0, 800))], ephemeral: guildSettings.ephemeral });
};

async function generateNerd(text) {
	const tempCanvas = createCanvas(498, 1);
	const tempCtx = tempCanvas.getContext("2d");
	tempCtx.font = "30px Impact";
	const multiLine = makeMultilineText(text, tempCtx);
	const measure = tempCtx.measureText(multiLine);
	const lines = multiLine.split("\n");
	const textHeight = measure.emHeightAscent * lines.length;
	const width = 498;
	const height = 480 + textHeight;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");
	const nerd = await loadImage("./nerd.png");

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "black";
	ctx.font = "30px Impact";
	ctx.textAlign = "center";
	ctx.drawImage(nerd, 0, textHeight);

	for (let i = 0; i < lines.length; i++) {
		ctx.fillText(lines[i], width / 2, measure.emHeightAscent * (i + 1));
	}

	return canvas.toBuffer();
}

/**
 * @param {string} text 
 * @param {CanvasRenderingContext2D} ctx 
 */
function makeMultilineText(text, ctx) {
	const words = text.split(" ");
	let ret = "";
	let firstWordInLine = true;

	while (words.length !== 0) {
		if (ctx.measureText(words[0]).width > ctx.canvas.width) {
			// too long to fit within the specified width, remove characters until it does
			let word = words[0];

			while (ctx.measureText(word).width > ctx.canvas.width) {
				word = word.slice(0, -1);
			}

			words[0] = words[0].slice(word.length);
			words.unshift(word);
		} else if (ctx.measureText(ret + (firstWordInLine ? "" : " ") + words[0]).width <= ctx.canvas.width) {
			if (!firstWordInLine) ret += " ";
			ret += words.shift();
			firstWordInLine = false;
		} else {
			ret += "\n";
			firstWordInLine = true;
		}
	}

	return ret;
}