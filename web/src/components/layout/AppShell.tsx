import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Flame, MapPin, HeartHandshake, User, Sparkles, Compass } from 'lucide-react';
import { RishiChatModal } from '@/features/ai/RishiChatModal';
import './AppShell.css';

export function AppShell() {
  const [rishiOpen, setRishiOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'Pujas', path: '/pujas', icon: Flame },
    { name: 'Gaushala', path: '/gaushala', icon: MapPin },
    { name: 'Seva', path: '/seva', icon: HeartHandshake },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="app-shell">
      {/* Top Header Bar */}
      <header className="app-header">
        <NavLink to="/" className="brand-badge">
          <span className="brand-om">ॐ</span>
          <span className="brand-title">PRATHA</span>
        </NavLink>

        <div className="header-actions">
          <div className="sanctuary-chip">
            <span className="pulse-indicator"></span>
            <span>Vrindavan Sanctum</span>
          </div>

          <button 
            className="btn-rishi-trigger" 
            onClick={() => setRishiOpen(true)}
            aria-label="Open Rishi Vedic Assistant"
          >
            <Sparkles size={15} />
            <span>Ask Rishi</span>
          </button>
        </div>
      </header>

      {/* Desktop Side Navigation */}
      <nav className="side-nav">
        <div className="desktop-brand">
          <div className="flex items-center gap-2">
            <span className="brand-om">ॐ</span>
            <span className="brand-title">PRATHA</span>
          </div>
          <p className="desktop-brand-motto">धर्मो रक्षति रक्षितः</p>
        </div>

        <div className="desktop-nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `desktop-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} strokeWidth={1.8} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="desktop-footer">
          <p className="font-semibold text-text-primary">Shri Krishna Gaushala</p>
          <p className="text-xs text-text-muted mt-0.5">Vrindavan, Uttar Pradesh</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      {/* Mobile Floating Bottom Navigation (5 Tabs) */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <item.icon size={21} strokeWidth={1.75} />
            </div>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Rishi AI Spiritual Companion Drawer */}
      <RishiChatModal isOpen={rishiOpen} onClose={() => setRishiOpen(false)} />
    </div>
  );
}
