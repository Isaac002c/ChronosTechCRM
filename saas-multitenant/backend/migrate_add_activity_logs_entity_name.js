const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting migration: add_activity_logs_entity_name...');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    const sqlFile = path.join(__dirname, 'migrations/add_activity_logs_entity_name.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Migration completed: activity_logs.entity_name column added');
    
    // Verify
    const check = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs' AND column_name = 'entity_name'
    `);
    
    if (check.rows.length > 0) {
      console.log('✅ Verified: entity_name column exists');
    } else {
      console.warn('⚠️  entity_name column not found (might already exist)');
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();

