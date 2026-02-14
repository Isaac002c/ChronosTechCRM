import { useState } from 'react';
import './ModuleLayout.css';

export default function ModuleLayout({ moduleName, tabs }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  const ActiveComponent = tabs.find(t => t.key === activeTab)?.component;

  return (
    <div className="module-container">
      
      {/* TOPO DO MÓDULO */}
      <div className="module-header">
        <h2>{moduleName}</h2>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ⋮
        </button>
      </div>

      <div className="module-body">
        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside className="module-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </aside>
        )}

        {/* CONTEÚDO */}
        <main className="module-content">
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  );
}
