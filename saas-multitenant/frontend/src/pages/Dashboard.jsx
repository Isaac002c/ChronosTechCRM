import { Routes, Route, Navigate } from 'react-router-dom';

import Header from '../components/Header';
import PageContainer from '../components/PageContainer';

// IMPORTA SÓ O COMPONENTE
import Leads from '../modules/leads/Leads';

export default function Dashboard() {
  return (
    <>
      <Header />

      <PageContainer>
        <Routes>
          <Route path="/" element={<Navigate to="/leads" />} />
          <Route path="/leads/*" element={<Leads />} />
        </Routes>
      </PageContainer>
    </>
  );
}
