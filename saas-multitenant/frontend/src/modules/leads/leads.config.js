//config do módulo//
import Overview from './pages/Overview';
import Acquisition from './pages/Acquisition';
import Performance from './pages/Performance';

export const leadsModule = {
  name: 'Leads',
  tabs: [
    { key: 'overview', label: 'Visão Geral', component: Overview },
    { key: 'acquisition', label: 'Aquisição & Funil', component: Acquisition },
    { key: 'performance', label: 'Performance', component: Performance },
  ]
};
