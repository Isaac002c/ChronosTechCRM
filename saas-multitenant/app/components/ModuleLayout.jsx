'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const moduleTabs = {
  leads: [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'acquisition', label: 'Acquisition', icon: '🎯' },
    { key: 'pipeline', label: 'Pipeline', icon: '🔄' },
    { key: 'performance', label: 'Performance', icon: '📈' },
    { key: 'reports', label: 'Reports', icon: '📑' },
  ],
  deals: [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'pipeline', label: 'Pipeline', icon: '🔄' },
    { key: 'performance', label: 'Performance', icon: '📈' },
  ],
  companies: [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'list', label: 'Lista', icon: '📋' },
  ],
  tasks: [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'kanban', label: 'Kanban', icon: '✅' },
    { key: 'calendar', label: 'Calendário', icon: '📅' },
  ],
  reports: [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'analytics', label: 'Analytics', icon: '📈' },
    { key: 'forecasts', label: 'Previsões', icon: '🔮' },
  ],
  settings: [
    { key: 'general', label: 'Geral', icon: '⚙️' },
    { key: 'team', label: 'Equipe', icon: '👥' },
    { key: 'integrations', label: 'Integrações', icon: '🔗' },
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
  
  const currentTab = externalActiveTab || searchParams.get('tab') || 'overview';
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
            <span className="tab-icon">{tab.icon}</span>
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

