const { Pool } = require("pg");

// 🔍 DEBUG - ver se a variável está chegando
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 🔥 TESTE DE CONEXÃO REAL
pool.connect()
  .then(client => {
    console.log("✅ Conectado ao banco com sucesso!");
    client.release();
  })
  .catch(err => {
    console.error("❌ ERRO COMPLETO AO CONECTAR NO BANCO:");
    console.error(err);
  });

module.exports = pool;