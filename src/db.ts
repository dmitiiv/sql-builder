import {
    Pool, PoolClient, PoolConfig
} from 'pg';
import { QueryCallback } from './types';
import { Insert } from './insert';
import { Select } from './select';

class Database {
    pool: Pool;
    config: PoolConfig

    constructor(config: PoolConfig) {
        this.config = config;
        this.pool = new Pool(config).on('error', (err) => {
            // eslint-disable-next-line no-console
            console.error('Unexpected error on idle client', err)
            process.exit(-1)
        })
    }

    query(sql: string, values: unknown[], callback: QueryCallback) {
        const retries = 5;
        const delay = 1000;

        // Очередность запуска контейнера и PGBouncer не определена. Происходит Error: connect ECONNREFUSED 127.0.0.1:6432
        const attemptQuery = (attempt: number) => {
            this.pool.connect()
                .then((client: PoolClient) => {
                    client.query(sql, values, (err, res) => {
                        if (callback) {
                            callback(err, res);
                        }
                        client.release();
                    });
                })
                .catch((err) => {
                    if (attempt < retries) {
                        // eslint-disable-next-line no-console
                        console.error(`Connection attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
                        setTimeout(() => attemptQuery(attempt + 1), delay);
                    } else {
                        // eslint-disable-next-line no-console
                        console.error('All connection attempts failed.');
                        if (callback) {
                            callback(err, null);
                        }
                    }
                });
        };

        attemptQuery(0);
    }

    select(table: string) {
        return new Select(this, table);
    }

    insert(table: string) {
        return new Insert(this, table)
    }

    close() {
        this.pool.end();
    }
}

const db = {
    open: (config: PoolConfig) => new Database(config)
}

export {
    db,
    Database
};

