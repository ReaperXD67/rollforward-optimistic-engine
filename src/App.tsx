import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight } from 'lucide-react';
import { CommandDeck } from './components/CommandDeck';
import { Hero } from './components/Hero';
import { NavBar } from './components/NavBar';
import { ProofGrid } from './components/ProofGrid';
import { useRollforwardEngine } from './hooks/useRollforwardEngine';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function App() {
  const root = useRef<HTMLElement>(null);
  const engine = useRollforwardEngine();

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;

      gsap.from('.hero-copy > *', {
        y: 46,
        opacity: 0,
        duration: 1.15,
        stagger: 0.09,
        ease: 'power3.out',
      });
      gsap.from('.hero-media', {
        xPercent: 12,
        scale: 0.88,
        opacity: 0,
        duration: 1.5,
        ease: 'expo.out',
      });
      gsap.to('.word-reveal span', {
        opacity: 1,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: {
          trigger: '.word-reveal',
          start: 'top 82%',
          end: 'bottom 42%',
          scrub: 0.6,
        },
      });
      gsap.utils.toArray<HTMLElement>('.stack-card').forEach((card, index) => {
        gsap.fromTo(
          card,
          { y: 80 + index * 14, scale: 0.94, opacity: 0.2 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              end: 'top 58%',
              scrub: 0.7,
            },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <main className="app" ref={root}>
      <NavBar />
      <Hero />
      <ProofGrid />
      <CommandDeck {...engine} />
      <footer className="site-footer">
        <div>
          <p className="overline">The review should start with a question</p>
          <h2>What happens when the request fails?</h2>
        </div>
        <div className="footer-actions">
          <a
            className="button button-primary"
            href="https://github.com/ReaperXD67/rollforward-optimistic-engine/blob/main/DECISIONS.md"
            target="_blank"
            rel="noreferrer"
          >
            Read the decisions <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <a href="#top" className="back-to-top">Back to top</a>
        </div>
        <div className="footer-line">
          <span>ROLLFORWARD</span>
          <span>Optimistic interface engineering proof</span>
          <span>Built for human review</span>
        </div>
      </footer>
    </main>
  );
}

