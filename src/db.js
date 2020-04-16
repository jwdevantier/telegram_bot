const { Pool } = require('pg');

const schema = "public"
const pool = new Pool({
    user: "tbot",
    host: "localhost",
    database: "postgres",
    password: "lokimon",
    port: 6000,
});

class Client {
    constructor () {
        this.client = undefined;
    }

    async query(...args) {
        if (!this.client) {
            this.client = await pool.connect();
        }
        return this.client.query(...args);
    }

    release() {
        if (this.client) {
            this.client.release();
        }
        this.client = undefined;
    }
}

module.exports = {
    schema: schema,
    Client: Client,
}