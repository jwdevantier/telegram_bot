const Model = require("./model");
const Store = require("./store");

class ContextState extends Model {
    constructor(user_id, context_key, store) {
        super();
        if (!Number.isInteger(user_id)) {
            throw Error(`invalid 'user_id', expected integer, got: ${typeof user_id}`);
        }
        this._user_id = user_id;

        if (!typeof context_key == "string") {
            throw Error(`invalid 'context_key' expected string, got: ${typeof context_key}`)
        }
        this._context_key = context_key;

        this._store = store == undefined ? new Store() : store;
        if (!(this._store instanceof Store)){
            console.log("????????????????????????????????????????????");
            throw Error(`ContextState(): expected 'store' to be Store|undefined, got: ${typeof store}`);
        }
    }

    get user_id() {
        return this._user_id;
    }

    get context_key() {
        return this._context_key;
    }

    get store() {
        console.log("CRAS");
        console.log(`ContextState.store: ${this._store.constructor.name} | ${this._store instanceof Store}`);
        console.log(JSON.stringify(this._store));
        return this._store;
    }

    get dirty() {
        return this._store.dirty;
    }
}

module.exports = ContextState;