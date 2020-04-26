const Command = require('./Command');

class Event extends Command {
    static _summary = `manage events & reminders`;
    static _example = `/event`;

    static rgx = /^\/event\s*/

    static async match(session, msg) {
        const m = msg.text.toString().match(this.rgx)
        if (!m) {
            return;
        }
        return true;
    }

    static async handle(bot, session, msg, match) {
        await session.context_push("event");
    }
}

module.exports = Event;