import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const modules = [
  { name: 'Leads', path: '/leads' },
  { name: 'Financeiro', path: '/financeiro' },
  { name: 'Cyber', path: '/cyber' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentModule =
    modules.find(m => location.pathname.startsWith(m.path))?.name || 'Dashboard';

  function handleSelect(path) {
    navigate(path);
    setOpen(false);
  }

  return (
    <header className="app-header">
 <div className="header-left">
  <strong className="logo">ChronosTech</strong>
</div>

<div className="header-right">
  <button className="module-selector" onClick={() => setOpen(!open)}>
    {currentModule}
    <span className="arrow">▾</span>
  </button>

  {open && (
    <div className="module-dropdown">
      {modules.map(module => (
        <button
          key={module.name}
          onClick={() => handleSelect(module.path)}
        >
          {module.name}
        </button>
      ))}
    </div>
  )}
</div>

    </header>
  );
}
