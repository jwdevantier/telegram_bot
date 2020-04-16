const Command = require('./Command');

class Quit extends Command {
    static _summary = `quit current context (~abort what you're doing)`;
    static _example = `/quit`

    static rgx = /^\/quit\s*/

    static async match(session, msg) {
        const m = msg.text.toString().match(this.rgx)
        if (!m) {
            return;
        }
        return true;
    }

    static async handle(bot, session, msg) {
        await session.context_pop();
        await bot.sendMessage(msg.chat.id, "Ok, returning to previous context...");
    }
}

module.exports = Quit;