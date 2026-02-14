'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const modules = [
  { key: 'leads', label: 'Leads' },
  { key: 'deals', label: 'Deals' },
  { key: 'companies', label: 'Companies' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

export default function Header({ user, tenant, onLogout }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const currentModule = searchParams.get('module') || 'leads';
  const currentModuleLabel = modules.find(m => m.key === currentModule)?.label || 'Leads';

  const handleModuleChange = (moduleKey) => {
    setDropdownOpen(false);
    router.push(`/dashboard?module=${moduleKey}&tab=overview`);
  };

  return (
    <header className="global-header">
      {/* Lado esquerdo - Logo e Nome */}
      <div className="header-left">
        <div className="header-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Chronos Tech</span>
        </div>
      </div>

      {/* Lado direito - Menu de Módulos */}
      <div className="header-right">
        {/* Dropdown de Módulos */}
        <div className="module-dropdown">
          <button 
            className="dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="module-icon">◉</span>
            {currentModuleLabel}
            <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
          </button>
          
          {dropdownOpen && (
            <div className="dropdown-menu">
              {modules.map((module) => (
                <button
                  key={module.key}
                  className={`dropdown-item ${currentModule === module.key ? 'active' : ''}`}
                  onClick={() => handleModuleChange(module.key)}
                >
                  {module.key === 'leads' && '📊 '}
                  {module.key === 'deals' && '💼 '}
                  {module.key === 'companies' && '🏢 '}
                  {module.key === 'tasks' && '✅ '}
                  {module.key === 'reports' && '📈 '}
                  {module.key === 'settings' && '⚙️ '}
                  {module.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Tenant e Usuário */}
        <div className="header-user-info">
          <div className="tenant-badge">
            <span className="tenant-icon">🏢</span>
            {tenant?.name || 'Tenant'}
          </div>
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button onClick={onLogout} className="logout-btn-header">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

