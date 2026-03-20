const pool = require('./config/db');
const activityLogService = require('./services/activityLogService');

async function createTestActivity() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Buscando tenant e usuário...');
    
    const tenantRes = await client.query('SELECT id FROM tenants LIMIT 1');
    if (!tenantRes.rows.length) throw new Error('Nenhum tenant encontrado');
    const tenantId = tenantRes.rows[0].id;

    const userRes = await client.query(
      'SELECT id, name FROM users WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );
    if (!userRes.rows.length) throw new Error('Nenhum usuário encontrado');

    const userId = userRes.rows[0].id;
    const userName = userRes.rows[0].name;

    console.log(`✅ tenant: ${tenantId} | user: ${userName}`);

    await activityLogService.logCreate(
      tenantId, userId, 'client', 'test-client-1',
      'João Silva', 'Cliente "João Silva" criado'
    );

    await activityLogService.logUpdate(
      tenantId, userId, 'contract', 'test-contract-1',
      'Contrato #123', 'Contrato "#123" atualizado'
    );

    await activityLogService.logStatusChange(
      tenantId, userId, 'fine', 'test-fine-1',
      'Multa IPVA', 'pendente', 'deferido'
    );

    await activityLogService.logGeneric(
      tenantId, userId, 'login', 'user', 'Login realizado'
    );

    console.log('🔥 Logs criados com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    client.release();
  }
}

createTestActivity();