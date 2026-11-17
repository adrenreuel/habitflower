import postgres from 'postgres';

export type Sql = postgres.Sql;

export function createDb(url: string, max = 10): Sql {
  return postgres(url, {
    max,
    idle_timeout: 30,
    // Keep `date` columns as "YYYY-MM-DD" strings (local days), never shifted by time zones.
    types: { localDay: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x } },
    onnotice: () => {},
  });
}
