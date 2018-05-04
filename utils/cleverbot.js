const snekfetch = require("snekfetch");

module.exports = class Cleverbot {
    /**
     * Creates a Cleverbot instance.
     * @param {string} user 
     * @param {string} key 
     */
    constructor(user, key) {
        this.user = user;
        this.key = key;
        this.create();
    }

    // epic way to let me use await in the constructor but not really
    async create() {
        const response = (await snekfetch.post("https://cleverbot.io/1.0/create").set("Content-Type", "application/x-www-form-urlencoded").send({ user: this.user, key: this.key })).body;
        if (response.status !== "success") throw new Error(`Failed to create a cleverbot instance! ${response.status}`);
        this.nick = response.nick;
    }

    /**
     * Sends a message to Cleverbot and returns a response (hopefully).
     * @param {string} text 
     */
    async ask(text) {
        let responseText;

        while (!responseText) { // keep trying until we get a response
            const response = (await snekfetch.post("https://cleverbot.io/1.0/ask").set("Content-Type", "application/x-www-form-urlencoded").send({ user: this.user, key: this.key, nick: this.nick, text: text })).body;
            if (response.status !== "success") throw new Error(`Failed to get a response from cleverbot! ${response.status}`);
            responseText = response.response;
        }

        return responseText;
    }
};
