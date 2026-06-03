import { Pool } from "pg";

declare global {
  // allow global reuse in dev
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

let pool: Pool;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

pool = global.pgPool;

export default pool;