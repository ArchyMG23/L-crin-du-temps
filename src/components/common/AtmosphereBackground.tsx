import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * L'ÉCRIN DU TEMPS — Composant d'Ambiance Animée Globale
 *
 * Conforme aux spécifications 38, 39, 40, 41 & 42 :
 * - Thème-aware : en mode clair, les halos et particules sont beaucoup plus doux et discrets
 * - Vignette respirante dorée (ajustée selon thème sombre/ivoire)
 * - Mécanisme horloger en filigrane (masqué sur mobile pour fluidité 60fps absolue)
 * - Poussière d'or ascendante (14 à 45 particules selon breakpoint)
 * - Texture grainée délicate (SVG fractalNoise)
 * - Parallaxe curseur subtile sur Desktop (désactivée au tactile et en reduced-motion)
 */
export const AtmosphereBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const teethRef = useRef<SVGGElement>(null);
  const dustLayerRef = useRef<HTMLDivElement>(null);
  const movementRef = useRef<SVGSVGElement>(null);
  const gemRef = useRef<HTMLDivElement>(null);
  const { isLight } = useTheme();

  useEffect(() => {
    // 1. Génération des 24 dents du rouage d'horlogerie
    if (teethRef.current && teethRef.current.childNodes.length === 0) {
      const N = 24;
      const R = 150;
      const len = 14;
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const x1 = 200 + Math.cos(a) * R;
        const y1 = 200 + Math.sin(a) * R;
        const x2 = 200 + Math.cos(a) * (R + len);
        const y2 = 200 + Math.sin(a) * (R + len);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1.toString());
        line.setAttribute('y1', y1.toString());
        line.setAttribute('x2', x2.toString());
        line.setAttribute('y2', y2.toString());
        fragment.appendChild(line);
      }
      teethRef.current.appendChild(fragment);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // 2. Génération des particules de poussière d'or selon la résolution et le thème
    const dustLayer = dustLayerRef.current;
    if (dustLayer && !reduceMotion) {
      dustLayer.innerHTML = '';
      const width = window.innerWidth;
      // Allégement mobile (section 39 & 42) : 10 sur mobile, 20 tablette, 38 desktop
      const dustCount = width < 640 ? 10 : width < 1024 ? 20 : 38;

      for (let i = 0; i < dustCount; i++) {
        const d = document.createElement('div');
        d.className = 'ec-dust';
        const size = isLight ? (0.8 + Math.random() * 1.8) : (1 + Math.random() * 2.4);
        const startX = Math.random() * 100;
        const dur = 15 + Math.random() * 18;
        const delay = -Math.random() * dur;
        const drift = (Math.random() - 0.5) * 110;
        // En mode clair : opacité beaucoup plus douce pour ne pas faire "sale" sur ivoire
        const opacity = isLight
          ? (0.08 + Math.random() * 0.18)
          : (0.15 + Math.random() * 0.45);

        d.style.width = `${size}px`;
        d.style.height = `${size}px`;
        d.style.left = `${startX}vw`;
        d.style.bottom = '-2vh';

        if (typeof d.animate === 'function') {
          d.animate(
            [
              { transform: 'translate(0, 0)', opacity: 0 },
              { transform: 'translate(0, -20vh)', opacity, offset: 0.15 },
              { transform: `translate(${drift}px, -70vh)`, opacity, offset: 0.75 },
              { transform: `translate(${drift * 1.3}px, -105vh)`, opacity: 0 }
            ],
            {
              duration: dur * 1000,
              delay: delay * 1000,
              iterations: Infinity,
              easing: 'ease-in-out'
            }
          );
        }

        dustLayer.appendChild(d);
      }
    }

    // 3. Parallaxe curseur : Desktop uniquement, neutralisée au tactile ou en motion réduite
    let raf: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (raf || isTouch || reduceMotion) return;
      raf = window.requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;

        if (movementRef.current) {
          movementRef.current.style.transform = `translate(${x * -14}px, ${y * -14}px) rotate(${x * 2}deg)`;
        }
        if (gemRef.current) {
          gemRef.current.style.transform = `translate(${x * 22}px, ${y * 22}px)`;
        }
        raf = null;
      });
    };

    if (!isTouch && !reduceMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      if (!isTouch && !reduceMotion) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, [isLight]);

  return (
    <div id="ec-atmosphere" ref={containerRef} aria-hidden="true">
      {/* 1. Vignette respirante */}
      <div className="ec-vignette" />

      {/* 2. Mécanisme horloger en rotation ultra-lente */}
      <svg
        ref={movementRef}
        className="ec-movement"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke="var(--or-clair)" strokeWidth="0.6">
          <circle cx="200" cy="200" r="150" />
          <circle cx="200" cy="200" r="118" />
          <circle cx="200" cy="200" r="60" />
          <g ref={teethRef} id="ec-teeth" />
          <circle cx="120" cy="150" r="34" />
          <circle cx="270" cy="230" r="26" />
          <line x1="200" y1="200" x2="200" y2="70" />
          <line x1="200" y1="200" x2="300" y2="200" />
        </g>
      </svg>

      {/* 3. Halo organique doré en dérive */}
      <div ref={gemRef} className="ec-gem-ghost" />

      {/* 4. Overlay de grain doux */}
      <svg className="ec-grain" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="ec-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ec-noise)" />
      </svg>

      {/* 5. Couche de poussière d'or */}
      <div id="ec-dust-layer" ref={dustLayerRef} />
    </div>
  );
};
