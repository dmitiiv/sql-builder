import { Database } from './database';
import { QueryResult } from 'pg';
import { QueryCallback } from './types';

type WhereClause = {
    values: unknown[];
    clause: string;
}

const operators: Record<string, (key: string, index: number) => string> = {
    '>=': (key, i) => `${key} >= $${i}`,
    '<=': (key, i) => `${key} <= $${i}`,
    '<>': (key, i) => `${key} <> $${i}`,
    '>': (key, i) => `${key} > $${i}`,
    '<': (key, i) => `${key} < $${i}`,
    LIKE: (key, i) => `${key} LIKE $${i}`
};

const where = (conditions: Record<string, unknown>): WhereClause => {
    const clause: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    // eslint-disable-next-line guard-for-in
    for (const key in conditions) {
        let value = conditions[key];
        let condition: string | undefined;

        if (typeof value === 'number') {
            condition = `${key} = $${index}`;
        } else if (typeof value === 'string') {
            // Check for operators using regex
            const operatorMatch = value.match(/^(>=|<=|<>|>|<|LIKE)/);
            if (operatorMatch) {
                const operator = operatorMatch[0];
                condition = operators[operator](key, index);
                value = value.substring(operator.length).trim(); // Remove operator from value
            } else if (value.includes('*') || value.includes('?')) {
                value = value.replace(/\*/g, '%').replace(/\?/g, '_');
                condition = operators.LIKE(key, index);
            } else {
                condition = `${key} = $${index}`;
            }
        }

        if (condition) {
            clause.push(condition);
            values.push(value);
            index++;
        }
    }

    return { clause: clause.join(' AND '), values };
};

class Select {
    database: Database;
    table: string;
    cols: QueryResult['fields'] | null;
    rows: QueryResult['rows'] | null;
    rowCount: QueryResult['rowCount'] | 0;
    ready : false;
    whereClause?: string;
    columns: string[];
    values: unknown[];
    orderBy?: string;

    constructor(database: Database, table: string) {
        this.database = database;
        this.table = table;
        this.cols = null;
        this.rows = null;
        this.rowCount = 0;
        this.ready = false;
        this.whereClause = undefined;
        this.columns = ['*'];
        this.values = [];
        this.orderBy = undefined;
    }

    resolve(result: QueryResult) {
        const {
            rows, fields, rowCount
        } = result;
        this.rows = rows;
        this.cols = fields;
        this.rowCount = rowCount;
    }

    where(conditions: Record<string, unknown>) {
        const { clause, values } = where(conditions);
        this.whereClause = clause;
        this.values = values;
        return this;
    }

    fields(list: string[]) {
        this.columns = list;
        return this;
    }

    order(name: string) {
        this.orderBy = name;
        return this;
    }

    then(callback: QueryCallback) {
        // TODO: store callback to pool
        const {
            table, columns, values
        } = this;
        const {
            whereClause, orderBy
        } = this;
        const fields = columns.join(', ');
        let sql = `SELECT ${fields} FROM ${table}`;
        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }

        this.database.query(sql, values, (err, res) => {
            callback(err, res);
        });
    }
}

export { Select }


