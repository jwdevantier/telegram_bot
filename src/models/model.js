class Model {
    constructor() {
        this._new_inst = true;
        this._dirty = false;
    }

    get new_inst() {
        this._new_inst || true;
    }

    set new_inst(val) {
        this._new_inst = val;
    }

    get dirty() {
        return this._dirty;
    }
}

module.exports = Model;