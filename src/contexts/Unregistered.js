const Context = require("./Context");

const ffs = (p) => {
    const m = require(p);
    return new m()
}
class Unregistered extends Context {
    static commands = [
        require("../commands/Register"),
    ]
}

module.exports = Unregistered;