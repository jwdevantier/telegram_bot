const Store = require("./store");
const Model = require("./model");

class User extends Model {
    constructor(id, registered=false, store=undefined) {
        super();
        if (!Number.isInteger(id)) {
            throw Error("id must be an integer");
        }
        this._id = id;

        this.registered = registered;

        store = store == undefined ? new Store() : store;
        if (!store instanceof Store){
            throw Error("context must be a store");
        }
        this._store = store;

        // ensure model does not register as altered.
        this._dirty = false;
    }

    get id() {
        return this._id;
    }

    get registered() {
        return this._registered;
    }

    set registered(val) {
        if (!val instanceof Boolean) { 
            throw Error("registered must be a boolean");
        }
        this._registered = val;
        this._dirty = true;
    }

    get store() {
        return this._store;
    }

    get dirty() {
        console.log(`USER.dirty super.dirty(${super.dirty}) || this.store.dirty(${this._store.dirty})`);
        return super.dirty || this._store.dirty;
    }

    get context_key() {
        const context = this.store.get("context", []);
        
        if (!Array.isArray(context)) {
            console.log(`DEBUG: User.context_key - user.store.context != array`);
            if (context != undefined) {
                throw Error(`User.store.context: expected array|undefined, got ${typeof context}`);
            }
            // no context array, return default context
            return "default";
        } else if (context.length === 0) {
            return "default";
        }

        const current = context[context.length-1];
        if (!typeof current == "string") {
            throw Error(`User.context_key type error, expected string, got: ${typeof current}`);
        }
        return current;
    }

    context_push(context_key) {
        this.store.update("context", (v) => {
            if (!Array.isArray(v)) {
                v = [];
            }
            v.push(context_key);
            return v;
        });
    }

    context_pop() {
        this.store.update("context", (v) => {
            if (!Array.isArray(v)) {
                v = [];
            }
            v.pop();
            return v;
        });
    }
}

module.exports = User;