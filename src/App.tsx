import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight } from 'lucide-react';
import { CommandDeck } from './components/CommandDeck';
import { Hero } from './components/Hero';
import { NavBar } from './components/NavBar';
import { ProofGrid } from './components/ProofGrid';
import { longTailProfile } from './domain/scenarios';
import { useRollforwardEngine } from './hooks/useRollforwardEngine';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function App() {
  const root = useRef<HTMLElement>(null);
  const engine = useRollforwardEngine();
  const [scenarioBusy, setScenarioBusy] = useState(false);

  async function runFailurePath() {
    if (scenarioBusy) return;
    setScenarioBusy(true);
    await engine.runGuidedScenario(longTailProfile);
    setScenarioBusy(false);
  }

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;

      gsap.from('.hero-line > span', {
        yPercent: 112,
        duration: 1.25,
        stagger: 0.1,
        ease: 'expo.out',
      });
      gsap.from('.copy-reveal', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        delay: 0.36,
        ease: 'power3.out',
      });
      gsap.from('.hero-tunnel', {
        clipPath: 'inset(0 0 100% 0)',
        scale: 0.86,
        duration: 1.55,
        delay: 0.12,
        ease: 'expo.inOut',
      });
      gsap.to('.hero-tunnel', {
        scale: 0.91,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: '62% top',
          end: 'bottom top',
          scrub: 0.7,
        },
      });

      gsap.utils.toArray<HTMLElement>('.proof-card').forEach((card, index) => {
        gsap.from(card, {
          y: 58 + index * 8,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        });
      });

      const media = gsap.matchMedia();
      media.add('(min-width: 960px)', () => {
        const track = root.current?.querySelector<HTMLElement>('.flight-track');
        const windowElement = root.current?.querySelector<HTMLElement>('.flight-window');
        if (!track || !windowElement) return;

        const distance = () => Math.max(0, track.scrollWidth - windowElement.clientWidth);
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.flight-recorder',
            start: 'top top',
            end: () => `+=${distance() + window.innerHeight * 0.72}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        gsap.utils.toArray<HTMLElement>('.flight-panel').forEach((panel) => {
          gsap.fromTo(
            panel,
            { scale: 0.86, opacity: 0.28 },
            {
              scale: 1,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: ScrollTrigger.getAll().find((trigger) => trigger.trigger === document.querySelector('.flight-recorder'))?.animation,
                start: 'left 88%',
                end: 'center center',
                scrub: true,
              },
            },
          );
        });
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <main className="app" ref={root}>
      <NavBar />
      <Hero
        state={engine.state}
        releases={engine.releases}
        runningScenario={scenarioBusy}
        onRunScenario={() => void runFailurePath()}
      />
      <ProofGrid />
      <CommandDeck {...engine} />
      <footer className="site-footer">
        <div className="footer-statement">
          <h2>Don’t review the claim.<br />Interrogate the system.</h2>
          <p>
            Run the failures, export the transcript, inspect the invariants, and read every tradeoff.
          </p>
        </div>
        <div className="footer-actions">
          <a
            className="button button-primary"
            href="https://github.com/ReaperXD67/rollforward-optimistic-engine/blob/main/DECISIONS.md"
            target="_blank"
            rel="noreferrer"
          >
            Read engineering decisions <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <a href="#top" className="back-to-top">Back to top</a>
        </div>
        <div className="footer-line">
          <span>ROLLFORWARD</span>
          <span>Optimistic interface engineering</span>
          <span>Designed for hostile networks</span>
        </div>
      </footer>
    </main>
  );
}
