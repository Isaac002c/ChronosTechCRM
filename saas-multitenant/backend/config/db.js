const { Pool } = require("pg");

// 🔍 Verify DATABASE_URL is present (masked for security)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const masked = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
    console.log("[db.js] DATABASE_URL (masked):", masked);
  } catch (_) {
    console.log("[db.js] DATABASE_URL is set but could not be masked for display.");
  }
} else {
  console.error("[db.js] ⚠️  DATABASE_URL is NOT set — pool will fail to connect.");
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 s timeout on acquiring a connection
});

// 🔥 Eager connection test with full error diagnostics
(async () => {
  try {
    const client = await pool.connect();
    console.log("[db.js] ✅ Conectado ao banco com sucesso!");
    client.release();
  } catch (err) {
    console.error("[db.js] ❌ ERRO AO CONECTAR NO BANCO:");
    console.error("  message :", err.message);
    console.error("  code    :", err.code    ?? "(none)");
    console.error("  errno   :", err.errno   ?? "(none)");
    console.error("  syscall :", err.syscall ?? "(none)");
    console.error("  stack   :", err.stack);
  }
})();

module.exports = pool;