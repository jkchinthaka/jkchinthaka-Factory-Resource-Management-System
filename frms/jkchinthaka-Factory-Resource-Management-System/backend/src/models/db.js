const sql = require('mssql');

const server   = process.env.DB_HOST     || 'host.docker.internal';
const port     = parseInt(process.env.DB_PORT     || '1433');
const user     = process.env.DB_USER     || 'nelna_user';
const password = process.env.DB_PASSWORD || 'Nelna@123';
const dbName   = process.env.DB_NAME     || 'nelnaapp';

const baseOpts = {
  encrypt: process.env.DB_ENCRYPT     !== 'false',
  trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
  enableArithAbort: true,
  connectTimeout: 30000,
  requestTimeout: 30000
};

// Step 1 (run once): connect to master, create the target database if missing,
// then create a database-level user so the login succeeds.
async function ensureDatabaseAndUser() {
  const masterPool = new sql.ConnectionPool({
    server, port, user, password,
    options: baseOpts,
    pool: { max: 1, min: 0 }
  });
  try {
    await masterPool.connect();

    // Create the database if it does not exist
    await masterPool.request().query(
      `IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'${dbName}')
         CREATE DATABASE [${dbName}]`
    );

    // Grant access inside the target database via cross-db sp_executesql
    try {
      await masterPool.request().query(`
        EXEC [${dbName}].sys.sp_executesql N'
          IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N''${user}'')
          BEGIN
            CREATE USER [${user}] FOR LOGIN [${user}];
            ALTER ROLE db_owner ADD MEMBER [${user}];
          END
        '
      `);
    } catch (_) {
      // User may already have access (sysadmin, db_owner, etc.)
    }
  } catch (err) {
    // Continue even if setup fails; the actual connect() below will surface the real error
    console.warn('[db] Database setup warning:', err.originalError?.message || err.message);
  } finally {
    try { await masterPool.close(); } catch (_) {}
  }
}

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = ensureDatabaseAndUser()
      .then(() => {
        const pool = new sql.ConnectionPool({
          server, port, user, password,
          database: dbName,
          options: baseOpts,
          pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
        });
        return pool.connect().then(() => {
          pool.on('error', () => { poolPromise = null; });
          return pool;
        });
      })
      .catch(err => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

// query(sql, params) — same interface as mysql2 for drop-in compatibility.
// Returns [rows] for SELECT, [{ insertId, affectedRows }] for DML.
// Append '; SELECT SCOPE_IDENTITY() AS insertId' to INSERT statements that need the ID.
async function query(sqlStr, params = []) {
  const pool = await getPool();
  const req = pool.request();

  // Convert positional ? placeholders to named @p1, @p2, …
  let idx = 0;
  const convertedSql = sqlStr.replace(/\?/g, () => `@p${++idx}`);

  params.forEach((val, i) => {
    req.input(`p${i + 1}`, val);
  });

  const result = await req.query(convertedSql);

  // Multiple recordsets: the last one carries SCOPE_IDENTITY() result from INSERT
  if (result.recordsets && result.recordsets.length > 1) {
    const lastRs = result.recordsets[result.recordsets.length - 1];
    if (lastRs && lastRs.length > 0 && lastRs[0].insertId !== undefined) {
      return [{ insertId: lastRs[0].insertId, affectedRows: result.rowsAffected[0] || 0 }];
    }
  }

  if (result.recordset !== undefined) {
    return [result.recordset];
  }

  return [{ insertId: 0, affectedRows: result.rowsAffected?.[0] || 0 }];
}

module.exports = { query, getPool, sql };
