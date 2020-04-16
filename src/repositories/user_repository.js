const db = require('../db');
const User = require("../models/user");
const Store = require("../models/store");
const Repository = require("./repository");

const TABLE = `${db.schema}.user`


class UserRepository extends Repository {

    static instanceof_model(inst) {
        return inst instanceof User;
    }
    
    static _serialize(model) {
        return {
            id: model.id,
            registered: model.registered,
            store: JSON.stringify(model.store._state)
        }
    }

    static _deserialize(row) {
        console.log("User._deserialize ROW", JSON.stringify(row));
        console.log(typeof row.store);
        return new User(row.id, row.registered, new Store(row.store));
    }

    static async _fetch(client, pk_args) {
        let attrs = pk_args;
        if (pk_args instanceof User) {
            attrs = [pk_args.id];
        }
        console.log(`UserRepository.fetch, attrs: ${attrs}`)
        return await client.query(`SELECT * from ${TABLE} WHERE id = $1`, attrs);
    }

    static async _delete(client, pk_args) {
        let attrs = pk_args;
        if (pk_args instanceof User) {
            attrs = [pk_args.id];
        }
        return await client.query(`DELETE FROM ${TABLE} WHERE id = $1`, attrs);
    }

    static async _insert(client, user) {
        console.log(`${this.name}._insert: ${user}`);
        await client.query(`INSERT INTO ${TABLE} (id, registered, store) VALUES ($1, $2, $3)`, [
            user.id, user.registered, user.store]);
    }

    static async _update(client, user) {
        console.log(`${this.name}._update: ${JSON.stringify(user)}`);
        await client.query(`UPDATE ${TABLE} SET registered = $2, store = $3 WHERE id = $1`, [
            user.id, user.registered, user.store
        ]);
    }   
}

module.exports = UserRepository;