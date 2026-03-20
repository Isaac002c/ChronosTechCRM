const pool = require('./config/db');
const activityLogService = require('./services/activityLogService');

async function createTestActivity() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Buscando tenant_id e user_id real...');
    
    // Get first tenant
    const tenantRes = await client.query('SELECT id FROM tenants LIMIT 1');
    if (tenantRes.rows.length === 0) throw new Error('No tenants found. Create one first.');
    const tenantId = tenantRes.rows[0].id;
    
    // Get first user
    const userRes = await client.query('SELECT id, name FROM users WHERE tenant_id = $1 LIMIT 1', [tenantId]);
    if (userRes.rows.length === 0) throw new Error('No users found. Create one first.');
    const userId = userRes.rows[0].id;
    const userName = userRes.rows[0].name;
    
    console.log(`✅ Using tenant_id: ${tenantId}, user_id: ${userId} (${userName})`);
    
    // Test logs
    await activityLogService.logCreate(tenantId, userId, 'client', 'test-client-1', 'João Silva', 'Cliente "João Silva" criado');
    await activityLogService.logUpdate(tenantId, userId, 'contract', 'test-contract-1', 'Contrato #123', 'Contrato "#123" atualizado');
    await activityLogService.logStatusChange(tenantId, userId, 'fine', 'test-fine-1', 'Multa IPVA', 'pendente', 'deferido');
    await activityLogService.logGeneric(tenantId, userId, 'login', 'user', 'Teste de login');
    
    console.log('✅ Test activity logs created! Check /multas/history');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    client.release();
  }
}

createTestActivity();
