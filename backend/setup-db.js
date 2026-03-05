const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const masterConfig = {
  server: 'localhost',
  port: 1433,
  user: 'nelna_user',
  password: 'Nelna@123',
  database: 'master',
  options: { encrypt: true, trustServerCertificate: true }
};

const fupmsConfig = {
  ...masterConfig,
  database: 'NELNA_APP'
};

async function run() {
  // Step 1: Use NELNA_APP database (already exists)
  console.log('Connecting to NELNA_APP...');
  let pool = await sql.connect(fupmsConfig);

  // List existing tables
  const existing = await pool.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
  );
  console.log('Existing tables:', existing.recordset.map(t => t.TABLE_NAME).join(', ') || '(none)');

  // Step 2: Run schema

  const schemaPath = path.join(__dirname, 'src', 'models', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split by GO or by semicolons at statement boundaries
  // T-SQL schema uses IF/CREATE blocks - execute the whole thing at once
  // But MERGE needs separate execution. Split on empty lines between major blocks.
  const batches = schemaSql.split(/\n\n+/).filter(b => b.trim().length > 0);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i].trim();
    if (!batch) continue;
    try {
      await pool.query(batch);
      console.log(`  Batch ${i + 1}/${batches.length} OK`);
    } catch (err) {
      console.error(`  Batch ${i + 1} error: ${err.message}`);
      // Show the first 100 chars of the failing batch for debugging
      console.error(`  SQL: ${batch.substring(0, 100)}...`);
    }
  }

  // Verify tables created
  const tables = await pool.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
  );
  console.log('\nTables in NELNA_APP:');
  tables.recordset.forEach(t => console.log('  -', t.TABLE_NAME));

  await pool.close();
  console.log('\nDatabase setup complete!');
  process.exit(0);
}

run().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
