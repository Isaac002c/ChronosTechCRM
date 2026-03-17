'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const moduleTabs = {
  leads: [
    { key: 'overview', label: 'Overview' },
    { key: 'acquisition', label: 'Acquisition' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'leaderboard', label: 'Ranking' },
    { key: 'performance', label: 'Performance' },
    { key: 'export', label: 'Exportar' },
    { key: 'reports', label: 'Reports' },
  ],
  multas: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'clients', label: 'Clientes' },
    { key: 'contracts', label: 'Multas' },
    { key: 'documents', label: 'Documentos' },
    { key: 'history', label: 'Historico' },
  ],
  settings: [
    { key: 'general', label: 'Geral' },
    { key: 'team', label: 'Equipe' },
    { key: 'integrations', label: 'Integracoes' },
  ],
};

export default function ModuleLayout({ 
  children, 
  moduleKey = 'leads', 
  moduleName = 'Módulo',
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obter aba padrão baseada no módulo
  const getDefaultTab = (module) => {
    const defaults = {
      leads: 'overview',
      multas: 'dashboard',
      settings: 'general'
    };
    return defaults[module] || 'overview';
  };
  
  const defaultTab = getDefaultTab(moduleKey);
  const currentTab = externalActiveTab || searchParams.get('tab') || defaultTab;
  const tabs = moduleTabs[moduleKey] || moduleTabs.leads;

  const handleTabChange = (tabKey) => {
    if (externalOnTabChange) {
      externalOnTabChange(tabKey);
    } else {
      router.push(`/dashboard?module=${moduleKey}&tab=${tabKey}`);
    }
  };

  return (
    <div className="module-container">
      {/* Título do Módulo */}
      <div className="module-header">
        <h1 className="module-title">{moduleName}</h1>
      </div>

      {/* Navegação Interna (Tabs) */}
      <div className="module-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`module-tab ${currentTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo do Módulo */}
      <div className="module-content">
        {children}
      </div>
    </div>
  );
}
