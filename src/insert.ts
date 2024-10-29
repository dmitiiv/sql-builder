import { Database } from './database';
import { QueryCallback } from './types';

class Insert {
    database: Database;
    table: string;
    columns: string[];
    values: unknown[];

    constructor(database: Database, table: string) {
        this.database = database;
        this.table = table;
        this.columns = [];
        this.values = [];
    }

    set(data: Record<string, unknown>) {
        this.columns = Object.keys(data);
        this.values = Object.values(data);
        return this;
    }

    then(callback: QueryCallback) {
        const fields = this.columns.join(', ');
        const placeholders = this.columns.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${this.table} (${fields}) VALUES (${placeholders}) RETURNING *`;

        this.database.query(sql, this.values, (err, res) => {
            callback(err, res);
        });
    }
}

export { Insert }

