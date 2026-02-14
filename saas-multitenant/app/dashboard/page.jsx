'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import ModuleLayout from '../components/ModuleLayout';

// Leads Components
import LeadsOverview from '../leads/Overview';
import LeadsAcquisition from '../leads/Acquisition';
import LeadsPipeline from '../leads/Pipeline';
import LeadsPerformance from '../leads/Performance';
import LeadsReports from '../leads/Reports';

// Componentes placeholder para outros módulos
const ComingSoon = ({ moduleName }) => (
  <div className="coming-soon">
    <div className="coming-soon-icon">🚧</div>
    <h2>{moduleName} em breve</h2>
    <p>Este módulo está em desenvolvimento</p>
  </div>
);

// Mapeamento de módulos e suas páginas
const modulePages = {
  leads: {
    name: 'Leads',
    pages: {
      overview: LeadsOverview,
      acquisition: LeadsAcquisition,
      pipeline: LeadsPipeline,
      performance: LeadsPerformance,
      reports: LeadsReports,
    }
  },
  deals: {
    name: 'Deals',
    pages: {
      overview: () => <ComingSoon moduleName="Deals" />,
      pipeline: () => <ComingSoon moduleName="Deals Pipeline" />,
      performance: () => <ComingSoon moduleName="Deals Performance" />,
    }
  },
  companies: {
    name: 'Companies',
    pages: {
      overview: () => <ComingSoon moduleName="Companies" />,
      list: () => <ComingSoon moduleName="Lista de Empresas" />,
    }
  },
  tasks: {
    name: 'Tasks',
    pages: {
      overview: () => <ComingSoon moduleName="Tarefas" />,
      kanban: () => <ComingSoon moduleName="Kanban de Tarefas" />,
      calendar: () => <ComingSoon moduleName="Calendário" />,
    }
  },
  reports: {
    name: 'Reports',
    pages: {
      overview: () => <ComingSoon moduleName="Relatórios" />,
      analytics: () => <ComingSoon moduleName="Analytics" />,
      forecasts: () => <ComingSoon moduleName="Previsões" />,
    }
  },
  settings: {
    name: 'Settings',
    pages: {
      general: () => <ComingSoon moduleName="Configurações" />,
      team: () => <ComingSoon moduleName="Equipe" />,
      integrations: () => <ComingSoon moduleName="Integrações" />,
    }
  },
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Parâmetros da URL
  const currentModule = searchParams.get('module') || 'leads';
  const urlTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    // Verificar autenticação
    const token = document.cookie.includes('auth-token');
    const userData = localStorage.getItem('user');
    const tenantData = localStorage.getItem('tenant');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setTenant(JSON.parse(tenantData || '{}'));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Erro ao fazer logout no backend:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      router.push('/login');
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    router.push(`/dashboard?module=${currentModule}&tab=${tabKey}`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Carregando Chronos Tech...</p>
      </div>
    );
  }

  // Obter módulo atual
  const moduleData = modulePages[currentModule] || modulePages.leads;
  const ActivePage = moduleData.pages[activeTab] || moduleData.pages.overview;

  return (
    <div className="app-container">
      {/* Header Global */}
      <Header 
        user={user} 
        tenant={tenant} 
        onLogout={handleLogout} 
      />

      {/* Área Principal com Margem */}
      <main className="main-area">
        <ModuleLayout
          moduleKey={currentModule}
          moduleName={moduleData.name}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        >
          <ActivePage />
        </ModuleLayout>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

