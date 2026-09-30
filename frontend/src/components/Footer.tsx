import { Link } from 'react-router-dom';
import CairnMark from './CairnMark';

export default function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><div><Link to="/" className="brand" aria-label="Cairn home"><CairnMark size={29} /><span>cairn.</span></Link><p>Leave a proof. Not a profile.</p></div><nav aria-label="Footer navigation"><Link to="/docs#privacy">Privacy model</Link><Link to="/docs#start">Getting started</Link><Link to="/admin">Deployment portal</Link></nav><span className="footer-note">Built with Compact.<br />Verified on Midnight.</span></div></footer>;
}
