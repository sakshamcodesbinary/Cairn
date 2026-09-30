import { ArrowUpRight, ArrowRight, Check, Fingerprint, KeyRound, LockKeyhole, Mountain, ShieldCheck, Ticket, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import CairnMark from '../components/CairnMark';

const steps = [
  { icon: KeyRound, title: 'Bring your invitation', text: 'A private secret and an issued clearance. No identity form.' },
  { icon: Fingerprint, title: 'Prove you belong', text: 'Midnight checks the invitation without publishing its contents.' },
  { icon: ShieldCheck, title: 'Leave only a receipt', text: 'A public badge records access. Your credentials stay private.' },
];

export default function HomePage() {
  return <div className="home-page">
    <section className="summit-hero" aria-labelledby="hero-title">
      <img className="summit-image" src="/images/cairn-summit.jpg" width="2200" height="1467" alt="A sunlit alpine valley with forested slopes and a distant snow-covered mountain range" fetchPriority="high" />
      <div className="summit-shade" aria-hidden="true" />
      <div className="hero-topline"><span className="hero-tag"><Mountain size={15} aria-hidden="true" /> A quieter way in</span><span className="hero-network">Built on Midnight</span></div>
      <div className="hero-composition">
        <div className="hero-copy-column">
          <h1 id="hero-title">Access is personal.<br />Your identity<br />stays that way.</h1>
          <p>An invitation should open a door, not a file on you. Prove you belong with Cairn. Keep the rest to yourself.</p>
          <div className="hero-actions"><Link className="button button-glacier" to="/prove">Use your invitation <ArrowUpRight size={19} aria-hidden="true" /></Link><Link className="hero-secondary" to="/admin">Create a private gate <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        </div>
        <div className="invitation-art" aria-label="Illustration of a private invitation, not a live receipt">
          <div className="invitation-top"><CairnMark size={28} /><span>Private by invitation</span><LockKeyhole size={17} aria-hidden="true" /></div>
          <div className="invitation-landscape" aria-hidden="true"><svg viewBox="0 0 340 132" fill="none"><path d="M0 119 72 41l35 31 49-62 81 83 42-40 61 66M0 130 66 65l42 29 50-56 79 78 44-40 59 54M0 141l62-53 48 28 50-52 74 74 48-40 58 44" stroke="currentColor" strokeWidth="1" /><circle cx="265" cy="27" r="12" stroke="currentColor" /></svg><span>Cairn field circle</span></div>
          <div className="invitation-details"><div><span>What you bring</span><strong>Your private invitation</strong></div><EyeOff size={18} aria-hidden="true" /></div>
          <div className="invitation-details"><div><span>What you share</span><strong>Only proof of access</strong></div><Check size={18} aria-hidden="true" /></div>
          <div className="invitation-foot"><span className="status-dot" /> Invitation preview <span>Not an on-chain receipt</span></div>
        </div>
      </div>
      <div className="hero-bottom"><span>For communities with a reason to be private.</span><Link to="/docs#privacy">Understand the privacy boundary <ArrowRight size={15} aria-hidden="true" /></Link></div>
    </section>

    <section className="journey-strip" aria-label="How private access works">{steps.map(({ icon: Icon, title, text }, index) => <article key={title} className="journey-step"><div className="journey-number">0{index + 1}</div><div><h2><Icon size={16} aria-hidden="true" />{title}</h2><p>{text}</p></div></article>)}</section>

    <section className="workspace-section">
      <div className="section-heading"><span className="section-kicker">Your next step</span><h2>A small footprint.<br />An open path.</h2><p>One place to use an invitation, check a receipt, or set the rules for your own circle.</p></div>
      <div className="action-list">
        <Link to="/prove" className="action-row"><span className="action-icon"><Ticket size={24} aria-hidden="true" /></span><span><strong>I have an invitation</strong><span>Prove access with your private credentials.</span></span><ArrowUpRight size={22} aria-hidden="true" /></Link>
        <Link to="/registry" className="action-row"><span className="action-icon"><ShieldCheck size={24} aria-hidden="true" /></span><span><strong>I’m checking a receipt</strong><span>Read the public registry. No wallet required.</span></span><ArrowUpRight size={22} aria-hidden="true" /></Link>
        <Link to="/admin" className="action-row"><span className="action-icon"><Mountain size={24} aria-hidden="true" /></span><span><strong>I’m creating a circle</strong><span>Deploy a gate and manage its invitation policy.</span></span><ArrowUpRight size={22} aria-hidden="true" /></Link>
      </div>
    </section>

    <section className="privacy-section" aria-labelledby="privacy-heading">
      <div className="privacy-photo"><img src="/images/cairn-forest.jpg" width="1200" height="800" loading="lazy" alt="A granite mountain face above a quiet evergreen forest" /><div><CairnMark size={30} /><span>Belonging doesn’t need<br />a public identity.</span></div></div>
      <div className="privacy-copy"><span className="section-kicker">Selective disclosure, in practice</span><h2 id="privacy-heading">A clear boundary.<br />Not a black box.</h2><p>Your invitation secret and issued clearance are private witnesses. The circuit checks them against the gate’s public policy.</p><div className="boundary-line"><EyeOff size={19} aria-hidden="true" /><div><strong>Kept out of the ledger</strong><p>Invitation secret, exact clearance, administrator secret.</p></div></div><div className="boundary-line"><Eye size={19} aria-hidden="true" /><div><strong>Intentionally public</strong><p>Gate policy, entry count, replay-prevention nullifier, and badge.</p></div></div><Link className="inline-link" to="/docs#privacy">Read the model and its limits <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
    </section>
    <section className="closing-note"><div><span className="status-dot" /><p>Preview for exploration. Preprod for your launch.</p></div><Link to="/docs#start">Start with the field guide <ArrowRight size={17} aria-hidden="true" /></Link></section>
  </div>;
}
