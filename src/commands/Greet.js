const Command = require('./Command');

class Greet extends Command {
    static _summary = `writes something nice to you`;
    static _example = `/greet <title>`;

    static rgx = /^\/greet (?<title>.+)/

    static async match(session, msg) {
        const m = msg.text.toString().match(this.rgx)
        if (!m) {
            return;
        }
        return m.groups;
    }

    static async handle(bot, session, msg, match) {
        await bot.sendMessage(msg.chat.id, `Greetings ${match["title"]} ${msg.chat.first_name}!`);
    }
}

module.exports = Greet;