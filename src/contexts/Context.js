class Context {
    static commands = [];

    static get context_name() {
        return this._context_name || this.name;
    }

    // handles text messages
    static async on_text(bot, session, msg) {
        let handled = false;
        // @ end of state - write user back to db if dirty
        for (let index = 0; index < this.commands.length; index++) {
            const cmd = this.commands[index];
            const match = await cmd.match(session, msg);
            if (match) {
                handled = true;
                await cmd.handle(bot, session, msg, match);
                break;
            }
        }
        if (!handled) {
            const help_msg_lines = [];
            help_msg_lines.push("I did not recognize that command.");
            help_msg_lines.push("");
            help_msg_lines.push(`*Available Commands:* (In context: ${this.context_name})`);
            for (let command of this.commands) {
                console.log(`command ${typeof command}|${command.name}`)
                help_msg_lines.push(`• \`${command.example}\``);
                help_msg_lines.push(`      ${command.summary}`);
            }

            await bot.sendMessage(msg.chat.id, help_msg_lines.join("\n"), {parse_mode: "markdown"});
        }
    }

    // TODO: similar handler functions for photo etc
}

module.exports = Context;