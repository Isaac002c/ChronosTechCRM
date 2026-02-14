'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [formData, setFormData] = useState({
    tenantName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantName: formData.tenantName,
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro ao criar conta');
      }

      // Redirecionar para login com mensagem de sucesso
      alert('Conta criada com sucesso! Faça login para continuar.');
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: '#1e293b',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '450px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#3b82f6',
            marginBottom: '8px'
          }}>
            ChronosTech
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Criar nova conta
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#ef4444',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Nome da Empresa (Tenant)
            </label>
            <input
              type="text"
              placeholder="Minha Empresa Ltda"
              value={formData.tenantName}
              onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Seu Nome
            </label>
            <input
              type="text"
              placeholder="João Silva"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Confirmar Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%',
              padding: '14px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontSize: '16px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          color: '#64748b',
          fontSize: '13px'
        }}>
          Já tem uma conta?{' '}
          <a href="/login" style={{ color: '#3b82f6' }}>
            Fazer login
          </a>
        </p>
      </div>
    </div>
  );
}

