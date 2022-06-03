const { TextChannel } = require("discord.js"); // eslint-disable-line no-unused-vars
/**
 * 
 * @param {TextChannel} channel 
 * @param {string} text 
 * @param {Number} time
 */
module.exports = async (channel, text, time) => {
    channel.send(text).then(msg => {
        setTimeout(() => {
            msg.delete();
        }, time);
    });
};