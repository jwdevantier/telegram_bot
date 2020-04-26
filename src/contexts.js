// Any state you wish to enable with the bot should be registered here
const contextmap = {
    "default": require("./contexts/Unregistered"),
    "home": require("./contexts/Home"),
    "event": require("./contexts/Event"),
}

module.exports = (key) => {
    if (key in contextmap) {
        return [key, contextmap[key]];
    }
    return ["default", contextmap["default"]];
}