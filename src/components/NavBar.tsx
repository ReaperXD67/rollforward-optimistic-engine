import { ArrowUpRight, GitBranch } from 'lucide-react';

export function NavBar() {
  return (
    <header className="site-nav-shell">
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="ROLLFORWARD home">
          <span className="brand-mark" aria-hidden="true"><GitBranch size={15} strokeWidth={2} /></span>
          <span>ROLLFORWARD</span>
        </a>
        <div className="nav-links">
          <a href="#system">Correctness</a>
          <a href="#flight-recorder">Failure paths</a>
          <a href="#command-deck">Live system</a>
        </div>
        <a
          className="nav-source"
          href="https://github.com/ReaperXD67/rollforward-optimistic-engine"
          target="_blank"
          rel="noreferrer"
        >
          Inspect source <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
