const UserRepository = require("./repositories/user_repository");
const ContextStateRepository = require("./repositories/context_state_repository");
const User = require("./models/user");
const ContextState = require("./models/contextstate");
const contexts = require("./contexts");
const Context = require("./contexts/Context");
const db = require("./db");


const fetchContext = async (client, user, contextKey=undefined) => {
    if (contextKey == undefined) {
        contextKey = user.context_key;
    }
    let context;

    [contextKey, cls] = contexts(contextKey);
    let state = await ContextStateRepository.fetch(client, user.id, contextKey);
    state = state != null ? state : new ContextState(user.id, contextKey);

    return {key: contextKey, cls, state}
}

class Session {
    constructor(user, context, contextKey, contextState) {
        if (!user instanceof User) {
            throw Error(`user: expected User, got ${typeof user}`);
        }
        this._user = user;

        if (!context instanceof Context) {
            throw Error(`context: expected Context, got ${typeof context}`);
        }
        this._context = context;

        if (typeof contextKey !== "string") {
            throw Error(`contextKey: expected string, got ${typeof contextKey}`);
        }
        this._contextKey = contextKey

        if (!contextState instanceof ContextState) {
            throw Error(`contextState: expected ContextState, got ${typeof contextState}`);
        }
        this._state = contextState;
    }

    static async fetch(client, user_id){
        if (!Number.isInteger(user_id)) {
            throw Error(`user_id: expected integer, got ${typeof user_id}`);
        }

        // fetch/create user model
        let user = await UserRepository.fetch(client, user_id);
        if (!user) {
            console.log("CREATING ENTRY");
            user = new User(user_id);
        }

        // fetch/create context state model
        const ctx = await fetchContext(client, user);
        return new Session(user, ctx.cls, ctx.key, ctx.state);
    }

    async context_push(contextKey, client = undefined) {
        let release_client = false;
        if (!client) {
            client = new db.Client();
            release_client = true;
        }
        try{
            this._user.context_push(contextKey);
            let ctx = await fetchContext(client, this._user, contextKey);
            console.log("context_push ctx");
            console.log(ctx);
            this._state = ctx.state;
            this._contextKey = ctx.key;
            this._context = ctx.cls;
        } finally {
            if (release_client) {
                client.release();
            }
        }
    }

    async context_pop(client = undefined) {
        let release_client = false;
        if (!client) {
            client = new db.Client();
            release_client = true;
        }
        try { 
            this._user.context_pop();
            let ctx = await fetchContext(client, this._user);
            this._state = ctx.state;
            this._contextKey = ctx.key;
            this._context = ctx.cls;
        } finally {
            if (release_client) {
                client.release();
            }
        }
        
    }

    get user() {
        return this._user;
    }

    get context() {
        return this._context;
    }

    get contextKey() {
        return this._contextKey;
    }

    get state() {
        return this._state;
    }

    async write(client) {
        try {
            await client.query(`BEGIN`);
            UserRepository.write(client, this.user);
            ContextStateRepository.write(client, this.state);
            await client.query(`COMMIT`);
        } catch (e) {
            console.error(`Failed to write user session to DB: ${e}`);
            await client.query(`ROLLBACK`);
            throw e;
        }
    }
}

module.exports = Session;