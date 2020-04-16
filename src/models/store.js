const $ = require('lodash');

class Store {
    constructor(state=undefined,) {
        this._state = state != undefined ? state : {};
        this._update = state != undefined
        this._dirty = false;
    }

    // set(key, value) {
    //     this._state[key] = value;
    //     this._dirty = true;
    // }

    set(path, value) {
        $.set(this._state, path, value);
        this._dirty = true;
    }

    update(path, fn, ...args) {
        let val = this.get(path, null);
        this.set(path, fn(val, ...args));
    }

    // get(key, fallback = undefined) {
    //     let val = this._state[key];
    //     if (val !== undefined) {
    //         return val;
    //     } else if(fallback !== undefined) {
    //         return fallback;
    //     }
    //     throw Error("key does not exist");
    // }

    get(path, fallback = undefined) {
        const val = $.get(this._state, path, fallback);
        if (val !== undefined) {
            return val;
        } else if (fallback !== undefined) {
            return fallback;
        }
        throw Error(`value at path ${JSON.stringify(path)} does not exist and no default was provided`);
    }

    mark_dirty() {
        this._dirty = true;
    }

    get dirty() {
        return this._dirty;
    }
}

module.exports = Store;