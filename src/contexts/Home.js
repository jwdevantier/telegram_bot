const Context = require("./Context");


class Home extends Context {
    static commands = [
        require("../commands/Greet"),
        require("../commands/Event"),
        require("../commands/Quit"),
    ]
}

module.exports = Home;