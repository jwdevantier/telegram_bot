//const db = require("./db.js");
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_TOKEN;
const { Pool } = require('pg');

const bot = new TelegramBot(token, {polling: true});

console.log("Hello, world!!!");

const help = `\
One
Two
Three
`;

const schema = "public"
const pool = new Pool({
    user: "tbot",
    host: "localhost",
    database: "postgres",
    password: "lokimon",
    port: 6000,
});

const interceptor = (...interceptors) => {
    if (interceptors.length == 0) {
      throw Error("no interceptors given");
    }
    // ensures all interceptors can call the next fn in the chain
    interceptors.push((nxt, ctx) => {});

    return interceptors.reverse().reduce((nxt, f) => {
      return async (ctx) => await f(nxt, ctx)
    });
}

// TODO: check for custom rejection fn in ctx, show if need be
// TODO: consider renaming to isuser (?) or factoring out the checks.
const authorized = async (nxt, ctx) => {
    console.log("AUTHORIZED ENTERED");
    const {client, msg} = ctx;
    try {
        const res = await client.query(`SELECT COUNT(*) as count from public.user WHERE id = $1`, [msg.chat.id]);
        const isAuthorized = parseInt(res.rows[0]["count"]) !== 0;
        if (isAuthorized) {
            nxt(ctx);
        } else {
            await bot.sendMessage(msg.chat.id, "not authorized");
        }
    } catch(e) {
        console.error(`failed to find user entry`);
        throw e;
    }
}

const withdb = async (nxt, ctx) => {
    console.log("WITHDB ENTERED");
    if ("client" in ctx) {
        console.log("WITHDB SKIPPING");
        return await nxt(ctx)
    }
    const client = await pool.connect()
    ctx["client"] = client;
    try {
        console.log("WITHDB GOT CONN");
        return await nxt(ctx)
    } finally {
        client.release();
    }
}


const initBot = async () => {
    // log errors to stdout
    bot.on("polling_error", (msg) => console.log(msg));

    bot.onText(/\/start/, async (msg) => {
        await bot.sendMessage(msg.chat.id, "Hey!");
        await bot.sendMessage(msg.chat.id, help);
    });

    bot.onText(/^\/register (.+)/, async(msg, match) => {

        const pw = match[1];
        if (pw !== "lokimon") {
            await bot.sendMessage(msg.chat.id, "Fuck off...");
            return;
        }
        await bot.sendMessage(msg.chat.id, "Correct");
        const client = await pool.connect()
        try {
            await client.query(`BEGIN`);
            await client.query(`INSERT INTO ${schema}.user (id) VALUES ($1) RETURNING id`, [msg.chat.id]);
            await client.query(`COMMIT`);
        } catch (e) {
            console.error(`Failed to insert user: ${e}`);
            await client.query(`ROLLBACK`);
            throw e;
        } finally {
            client.release();
        }
    });

    bot.onText(/^\/unregister/, async (msg) => {
        interceptor(withdb, authorized, async (nxt, ctx) => {
            const {client} = ctx;
            try {
                const res = await client.query(`DELETE FROM ${schema}.user WHERE id = $1`, [msg.chat.id]);
                if (res.rowCount === 1) {
                    await bot.sendMessage(msg.chat.id, "DONE");
                } else {
                    await bot.sendMessage(msg.chat.id, "DAFUQ");
                }
            } catch(e) {
                console.error(`Failed to unregister`);
                throw e;
            }
            await bot.sendMessage(msg.chat.id, "UNREGISTERED");
        })({msg});
    });

    bot.onText(/^\/dbls/, async (msg) => {
        interceptor(withdb, authorized, async (nxt, ctx) => {
            console.log("inner");
            await bot.sendMessage(msg.chat.id, "GOT IT");
        })({msg});
    });

    bot.onText(/^([^\/].+)/, async (msg, match) => {
        console.log("TRIGGERED");
        await bot.sendMessage(msg.chat.id, `Unrecognized: ${match[1]}`);
    });
}

(async () => {
    await initBot();
    console.log("INIT DONE")

})();







console.log("DOOOONE");