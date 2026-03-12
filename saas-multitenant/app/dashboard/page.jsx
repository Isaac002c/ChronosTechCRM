'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import ModuleLayout from '../components/ModuleLayout';

// Leads Components
import LeadsOverview from '../leads/Overview';
import LeadsAcquisition from '../leads/Acquisition';
import LeadsPipeline from '../leads/Pipeline';
import LeadsLeaderboard from '../leads/Leaderboard';
import LeadsExport from '../leads/Export';
import LeadsPerformance from '../leads/Performance';
import LeadsReports from '../leads/Reports';

// Multas Components
import MultasDashboard from '../multas/Dashboard';
import MultasClients from '../multas/Clients';
import MultasContracts from '../multas/Contracts';
import MultasDocuments from '../multas/Documents';
import MultasUsers from '../multas/Users';
import MultasHistory from '../multas/History';

// Settings Components
import SettingsPage from '../settings/page';

// Componentes placeholder para outros módulos
const ComingSoon = ({ moduleName }) => (
  <div className="coming-soon">
    <div className="coming-soon-icon">[Em Breve]</div>
    <h2>{moduleName} em breve</h2>
    <p>Este modulo esta em desenvolvimento</p>
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
      leaderboard: LeadsLeaderboard,
      export: LeadsExport,
      performance: LeadsPerformance,
      reports: LeadsReports,
    }
  },
  multas: {
    name: 'Multas',
    pages: {
      dashboard: MultasDashboard,
      clients: MultasClients,
      contracts: MultasContracts,
      documents: MultasDocuments,
      users: MultasUsers,
      history: MultasHistory,
    }
  },
  settings: {
    name: 'Settings',
    pages: {
      general: SettingsPage,
      team: () => <ComingSoon moduleName="Equipe" />,
      integrations: () => <ComingSoon moduleName="Integrações" />,
    }
  },
};

// Função para obter a aba padrão baseada no módulo
const getDefaultTab = (module) => {
  const defaults = {
    leads: 'overview',
    multas: 'dashboard',
    settings: 'general'
  };
  return defaults[module] || 'overview';
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
  const urlTab = searchParams.get('tab') || getDefaultTab(currentModule);

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
      // Chamar logout no backend (porta 5000)
      await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Erro ao fazer logout no backend:', err);
    } finally {
      // Limpar localStorage - todos os tokens
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('token');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenant-id');
      
      // Limpar cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = 'tenantId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      
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
        <p>Carregando ChronosTek...</p>
      </div>
    );
  }

  // Obter módulo atual
  const moduleData = modulePages[currentModule] || modulePages.leads;
  const defaultTab = getDefaultTab(currentModule);
  const ActivePage = moduleData.pages[activeTab] || moduleData.pages[defaultTab] || moduleData.pages.overview;

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

