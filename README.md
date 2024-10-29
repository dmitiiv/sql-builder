# sql-builder

## How to use

```
    import { db } from '../Database';

    const pg = db.open({});

    function select() {
        pg.select('foo')
            .where({ payload: 'some payload' })
            .fields(['payload', 'id', 'name'])
            .order('payload')
            .then((error: Error, result: QueryResult<{ payload: string }> | null) => {
                if (error) {
                    // eslint-disable-next-line no-console
                    console.error('Error', error)
                }
                // eslint-disable-next-line no-console
                console.table(result?.rows);
            });
    }

    select()

    function insert() {
        pg.insert('foo')
            .set({ name: 'name', payload: 'some payload' })
            .then((error: Error, result: QueryResult<{ payload: string }> | null) => {
                if (error) {
                    // eslint-disable-next-line no-console
                    console.error('Error', error)
                }
                // eslint-disable-next-line no-console
                console.log({ result: result?.rows[0] });
            })
    }

    insert()
```
