import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import ContractAddressBar from './components/ContractAddressBar';
import HomePage from './pages/HomePage';

const ProvePage = lazy(() => import('./pages/ProvePage'));
const RegistryPage = lazy(() => import('./pages/RegistryPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));

class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Never log private form or SDK inputs. */ }
  render() {
    return this.state.failed ? <div className="page-shell page-heading"><h1>The trail needs a refresh.</h1><p>A page resource could not load. Reload to try again. Unsaved credentials will be cleared.</p><button className="button button-primary" onClick={() => location.reload()}>Reload Cairn</button></div> : this.props.children;
  }
}
function RouteFocus() {
  const location = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Private invitation access', '/prove': 'Your invitation', '/registry': 'Public registry', '/admin': 'Deployment & administration', '/docs': 'Field guide' };
    document.title = `${titles[location.pathname] ?? 'Page not found'} · Cairn`;
    if (!location.hash) { window.scrollTo(0, 0); document.getElementById('main-content')?.focus({ preventScroll: true }); }
  }, [location.pathname, location.hash]);
  return null;
}
function AppShell() {
  const { pathname } = useLocation();
  return <div className="app-shell"><RouteFocus /><NavBar />{pathname !== '/' && <ContractAddressBar />}<main id="main-content" className="main-content" tabIndex={-1}><PageBoundary><Suspense fallback={<div className="page-shell page-heading" role="status"><p>Opening your workspace…</p></div>}><Routes>
    <Route path="/" element={<HomePage />} /><Route path="/prove" element={<ProvePage />} /><Route path="/registry" element={<RegistryPage />} /><Route path="/admin" element={<AdminPage />} /><Route path="/docs" element={<DocsPage />} />
    <Route path="*" element={<div className="page-shell page-heading"><span className="section-kicker">404 / Off the trail</span><h1>This path ends here.</h1><p>The page may have moved. Your gate settings are unchanged.</p><Link to="/" className="button button-primary">Return to overview</Link></div>} />
  </Routes></Suspense></PageBoundary></main><Footer /></div>;
}
export default function App() { return <ThemeProvider><WalletProvider><BrowserRouter><AppShell /></BrowserRouter></WalletProvider></ThemeProvider>; }
