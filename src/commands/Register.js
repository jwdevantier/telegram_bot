const Command = require('./Command');

class Register extends Command {
    static _summary = `register with bot - required for further interaction`;
    static _example = `/register <password>`

    static rgx = /^\/register (?<pw>.+)/

    static async match(session, msg) {
        const m = msg.text.toString().match(this.rgx)
        if (!m) {
            return;
        }
        return m.groups;
    }

    static async handle(bot, session, msg, match) {
        if (match["pw"] !== process.env.BOT_PASSWORD) {
            await bot.sendMessage(msg.chat.id, "Fuck off...");
            return;
        }

        await bot.sendMessage(msg.chat.id, "Correct");
        await session.context_push("home");
    }
}

module.exports = Register;