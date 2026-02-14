import ModuleLayout from '../layouts/ModuleLayout';
import { leadsModule } from '../modules/leads';

export default function Dashboard() {
  return (
    <ModuleLayout
      moduleName={leadsModule.name}
      tabs={leadsModule.tabs}
    />
  );
}
