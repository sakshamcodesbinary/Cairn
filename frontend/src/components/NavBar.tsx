import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, Menu, Wallet, X, LogOut, Sun, Moon } from 'lucide-react';
import CairnMark from './CairnMark';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { shorten } from '../lib/bytes';

const links = [
  { label: 'Overview', path: '/' },
  { label: 'Your invitation', path: '/prove' },
  { label: 'Registry', path: '/registry' },
  { label: 'Field guide', path: '/docs' },
  { label: 'Admin', path: '/admin' },
];

export default function NavBar() {
  const { pathname } = useLocation();
  const { address, isConnected, isConnecting, connect, disconnect, error, clearError } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMobileOpen(false); document.getElementById('menu-toggle')?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);
  return <header className="site-header">
    <div className="nav-shell">
      <Link className="brand" to="/" aria-label="Cairn home"><CairnMark /><span>cairn<span className="brand-period">.</span></span></Link>
      <nav className="desktop-nav" aria-label="Primary navigation">{links.map(link =>
        <Link className={`nav-link${pathname === link.path ? ' active' : ''}`} key={link.path} to={link.path} aria-current={pathname === link.path ? 'page' : undefined}>{link.label}</Link>
      )}</nav>
      <div className="nav-actions">
        <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'day' ? 'night' : 'day'} mode`} title={`Switch to ${theme === 'day' ? 'night' : 'day'} mode`}>{theme === 'day' ? <Moon size={19} /> : <Sun size={19} />}</button>
        {isConnected && address ? <button className="button button-secondary button-compact" onClick={disconnect} aria-label="Disconnect wallet"><span className="status-dot ok" /><span className="wallet-label">{shorten(address, 5, 4)}</span><LogOut size={16} aria-hidden="true" /></button> :
          <button className="button button-primary button-compact" onClick={() => void connect()} disabled={isConnecting}><Wallet size={17} aria-hidden="true" /><span>{isConnecting ? 'Connecting…' : 'Connect wallet'}</span></button>}
        <button id="menu-toggle" className="icon-button mobile-menu-toggle" onClick={() => setMobileOpen(value => !value)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="mobile-navigation">{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
    </div>
    {mobileOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{links.map(link => <Link key={link.path} className={`mobile-nav-link${pathname === link.path ? ' active' : ''}`} to={link.path} aria-current={pathname === link.path ? 'page' : undefined}>{link.label}</Link>)}</nav>}
    {error && <div className="wallet-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{error}</span><button className="icon-button" onClick={clearError} aria-label="Dismiss wallet error"><X size={18} /></button></div>}
  </header>;
}
