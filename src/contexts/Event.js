const Context = require("./Context");


class Event extends Context {
    static commands = [
        require("../commands/Quit"),
    ]
}

module.exports = Event;