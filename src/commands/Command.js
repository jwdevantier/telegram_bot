class Command {
    static get summary() {
        if (!this._summary) {
            throw Error("summary missing");
        }
        return this._summary;
    }

    static get example() {
        if (!this._example) {
            throw Error("example missing");
        }
        return this._example;
    }

    static type = "text";

    static async match(session, msg) {
        throw Error("match function missing");
    }

    static async handle(bot, session, msg) {
        throw Error("handle function missing");
    }
}

module.exports = Command;