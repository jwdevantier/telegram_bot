class Repository {

    static serialize(model) {
        return this._serialize(model);
    }

    static deserialize(row) {
        const model = this._deserialize(row);
        model._new_inst = false;
        return model;
    }

    static async write(client, model) {
        if (!model.dirty) {
            console.log(`${this.name}.write: model not dirty, skipping!`);
            return;
        }
        console.log(`${this.name}.write: model dirty, writing!`);
        console.log(model);
        if (model._new_inst) {
            await this.insert(client, model);
        } else {
            await this.update(client, model);
        }
    }

    static async fetch(client, ...args) {
        const res = await this._fetch(client, this._coerce_args(args));
        if (res.rowCount === 0) {
            return null;
        }
        if (res.rowCount > 1) {
            throw Error(`Repository error - fetch query returned ${res.rowCount} results, expected at most 1`);
        }
        return this.deserialize(res.rows[0]);
    }

    static async delete(client, ...args) {
        const res = await this._delete(client, this._coerce_args(args));
        console.log(`${this.name}.delete:`);
        console.log("RES", JSON.stringify(res));
        // TODO: need to ensure just one is deleted
        return res;
    }

    static async insert(client, model) {
        if (!this.instanceof_model(model)) {
            throw Error(`expected ${typeof this.model_cls}, got: ${typeof model}`)
        }
        await this._insert(client, this.serialize(model));
    }

    static async update(client, model) {
        if (!this.instanceof_model(model, this.model_cls)) {
            throw Error(`expected ${typeof this.model_cls}, got: ${typeof model}`)
        }
        await this._update(client, this.serialize(model));
    }

    static _coerce_args(args) {
        // if only one arg which is the model, unpack it
        if (args.length == 1 && this.instanceof_model(args[0])) {
            return args[0];
        }
        // otherwise return args
        return args;
    }

    // Must implement this:
    static async _serialize(model) {
        throw Error("not implemented");
    }

    static async _deserialize(row) {
        throw Error("not implemented");
    }

    static async _fetch(client, ...pk_attrs) {
        throw Error("not implemented");
    }

    static async _delete(client, user) {
        throw Error("not implemented");
    }

    static async _insert(client, user) {
        throw Error("not implemented");
    }

    static async _update(client, user) {
        throw Error("not implemented");
    }
}

module.exports = Repository;