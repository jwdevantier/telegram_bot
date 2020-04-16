const db = require('../db');
const Repository = require("./repository");
const ContextState = require("../models/contextstate");
const Store = require("../models/store");

const TABLE = `${db.schema}.context_state`


class ContextStateRepository extends Repository {
    static instanceof_model(inst) {
        return inst instanceof ContextState;
    }

    static _serialize(inst) {
        return {
            user_id: inst.user_id,
            context_key: inst.context_key,
            store: JSON.stringify(inst.store._state)
        }
    }

    static _deserialize(row) {
        console.log("ContextState._deserialize ROW", JSON.stringify(row));
        console.log(typeof row.store);
        return new ContextState(row.user_id, row.context_key, new Store(row.store));
    }

    static async _fetch(client, pk_args) {
        let attrs = pk_args;
        if (pk_args instanceof ContextState) {
            attrs = [pk_args.id, pk_args.context_key];
        }
        console.log(`UserRepository.fetch, attrs: ${attrs}`)
        return await client.query(`SELECT * from ${TABLE} WHERE user_id = $1 AND context_key = $2`, attrs);
    }

    static async _delete(client, pk_args) {
        let attrs = pk_args;
        if (pk_args instanceof ContextState) {
            attrs = [pk_args.id, pk_args.context_key];
        }
        return await client.query(`DELETE FROM ${TABLE} WHERE user_id = $1 AND context_key = $2`, attrs);
    }

    static async _insert(client, ctx) {
        await client.query(`INSERT INTO ${TABLE} (user_id, context_key, store) VALUES ($1, $2, $3)`, [
            ctx.user_id, ctx.context_key, ctx.store]);
    }

    static async _update(client, ctx) {
        await client.query(`UPDATE ${TABLE} SET store = $3 WHERE user_id = $1 AND context_key = $2`, [
            ctx.user_id, ctx.context_key, ctx.store
        ]);
    }
}

module.exports = ContextStateRepository;