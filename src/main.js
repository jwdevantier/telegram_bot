const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_TOKEN;
const contexts = require('./contexts');
const UserRepository = require("./repositories/user_repository");
const ContextStateRepository = require("./repositories/context_state_repository");
const User = require("./models/user");
const ContextState = require("./models/contextstate");
const db = require("./db");
const Session = require("./session");

const cron = require("./event_cron");


const bot = new TelegramBot(token, {polling: true});

cron(bot);

const initBot = async () => {
    // initialise
    bot.on("text", async (msg) => {
        const client = new db.Client();
        try {
            const session = await Session.fetch(client, msg.chat.id);
        
            await session.context.on_text(bot, session, msg);
            session.user.store.set("xyzs", true);
            session.state.store.set("c xyx", "true");
            await session.write(client);
        } finally {
            client.release();
        }
    })
    bot.on("polling_error", (msg) => console.log(msg));

};

(async () => {
    await initBot();
})();
