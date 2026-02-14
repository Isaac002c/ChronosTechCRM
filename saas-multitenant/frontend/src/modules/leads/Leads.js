import ModuleLayout from '../../layouts/ModuleLayout';
import { leadsModule } from './leads.config';

export default function Leads() {
  return (
    <ModuleLayout
      moduleName={leadsModule.name}
      tabs={leadsModule.tabs}
    />
  );
}
