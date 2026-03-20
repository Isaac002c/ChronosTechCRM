const { Pool } = require("pg");

// 🔍 Ver se a variável existe
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 🔥 TESTE REAL COM ERRO COMPLETO
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado ao banco com sucesso!");
    client.release();
  } catch (err) {
    console.error("❌ ERRO COMPLETO AO CONECTAR:");
    console.error(err.message);
    console.error(err.stack);
  }
})();

module.exports = pool;