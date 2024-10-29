import { QueryResult } from 'pg';

type QueryCallback = (err: Error, res: QueryResult | null) => void;

export type { QueryCallback }
