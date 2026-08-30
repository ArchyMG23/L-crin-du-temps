import React, { useEffect, useRef } from 'react';

/**
 * L'ÉCRIN DU TEMPS — Composant d'Ambiance Animée Globale
 *
 * Implémenté selon les spécifications 38, 39 et 40 :
 * - Vignette respirante dorée/noire (20s)
 * - Mécanisme horloger en filigrane (rotation ultra-lente ~4min/tour, masqué sur mobile)
 * - Masse organique floutée en dérive subtile (ec-gem-ghost)
 * - Poussière d'or ascendante (14 à 45 particules selon breakpoint)
 * - Texture grainée délicate (SVG fractalNoise)
 * - Parallaxe curseur subtile sur Desktop (désactivée au tactile et si prefers-reduced-motion)
 * - Z-index 0, pointer-events none, GPU-accelerated (transform & opacity uniquement).
 */
export const AtmosphereBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const teethRef = useRef<SVGGElement>(null);
  const dustLayerRef = useRef<HTMLDivElement>(null);
  const movementRef = useRef<SVGSVGElement>(null);
  const gemRef = useRef<HTMLDivElement>(null);

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

    // 2. Génération des particules de poussière d'or selon la résolution
    const dustLayer = dustLayerRef.current;
    if (dustLayer && !reduceMotion) {
      dustLayer.innerHTML = '';
      const width = window.innerWidth;
      const dustCount = width < 640 ? 14 : width < 1024 ? 26 : 45;

      for (let i = 0; i < dustCount; i++) {
        const d = document.createElement('div');
        d.className = 'ec-dust';
        const size = 1 + Math.random() * 2.5;
        const startX = Math.random() * 100;
        const dur = 14 + Math.random() * 18;
        const delay = -Math.random() * dur;
        const drift = (Math.random() - 0.5) * 120;
        const opacity = 0.15 + Math.random() * 0.5;

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
  }, []);

  return (
    <div id="ec-atmosphere" ref={containerRef} aria-hidden="true">
      {/* 1. Vignette respirante */}
      <div className="ec-vignette" />

      {/* 2. Mécanisme horloger en rotation douce */}
      <svg
        ref={movementRef}
        className="ec-movement"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke="var(--ec-or-clair)" strokeWidth="0.6">
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

/**
 * Helper DOM impératif pour intégration manuelle si besoin.
 */
export function mountAtmosphere(targetSelector = 'body') {
  if (document.getElementById('ec-atmosphere')) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const width = window.innerWidth;
  const dustCount = width < 640 ? 14 : width < 1024 ? 26 : 45;

  const root = document.createElement('div');
  root.id = 'ec-atmosphere';
  root.innerHTML = `
    <div class="ec-vignette"></div>
    <svg class="ec-movement" viewBox="0 0 400 400">
      <g fill="none" stroke="var(--ec-or-clair)" stroke-width="0.6">
        <circle cx="200" cy="200" r="150"/>
        <circle cx="200" cy="200" r="118"/>
        <circle cx="200" cy="200" r="60"/>
        <g id="ec-teeth"></g>
        <circle cx="120" cy="150" r="34"/>
        <circle cx="270" cy="230" r="26"/>
        <line x1="200" y1="200" x2="200" y2="70"/>
        <line x1="200" y1="200" x2="300" y2="200"/>
      </g>
    </svg>
    <div class="ec-gem-ghost"></div>
    <svg class="ec-grain" width="100%" height="100%">
      <filter id="ec-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter>
      <rect width="100%" height="100%" filter="url(#ec-noise)"/>
    </svg>
    <div id="ec-dust-layer"></div>
  `;

  const target = document.querySelector(targetSelector) || document.body;
  target.insertBefore(root, target.firstChild);

  const teeth = root.querySelector('#ec-teeth');
  const N = 24, R = 150, len = 14;
  if (teeth) {
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const x1 = 200 + Math.cos(a) * R, y1 = 200 + Math.sin(a) * R;
      const x2 = 200 + Math.cos(a) * (R + len), y2 = 200 + Math.sin(a) * (R + len);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toString()); line.setAttribute('y1', y1.toString());
      line.setAttribute('x2', x2.toString()); line.setAttribute('y2', y2.toString());
      teeth.appendChild(line);
    }
  }

  if (reduceMotion) return;

  const dustLayer = root.querySelector('#ec-dust-layer');
  if (dustLayer) {
    for (let i = 0; i < dustCount; i++) {
      const d = document.createElement('div');
      d.className = 'ec-dust';
      const size = 1 + Math.random() * 2.5;
      const startX = Math.random() * 100;
      const dur = 14 + Math.random() * 18;
      const delay = -Math.random() * dur;
      const drift = (Math.random() - 0.5) * 120;
      const opacity = 0.15 + Math.random() * 0.5;
      d.style.width = d.style.height = `${size}px`;
      d.style.left = `${startX}vw`;
      d.style.bottom = '-2vh';
      if (typeof d.animate === 'function') {
        d.animate([
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: 'translate(0,-20vh)', opacity, offset: 0.15 },
          { transform: `translate(${drift}px,-70vh)`, opacity, offset: 0.75 },
          { transform: `translate(${drift * 1.3}px,-105vh)`, opacity: 0 }
        ], { duration: dur * 1000, delay: delay * 1000, iterations: Infinity, easing: 'ease-in-out' });
      }
      dustLayer.appendChild(d);
    }
  }

  if (!isTouch) {
    const movement = root.querySelector<HTMLElement>('.ec-movement');
    const gem = root.querySelector<HTMLElement>('.ec-gem-ghost');
    let raf: number | null = null;
    window.addEventListener('mousemove', (e) => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        if (movement) movement.style.transform = `translate(${x * -14}px, ${y * -14}px) rotate(${x * 2}deg)`;
        if (gem) gem.style.transform = `translate(${x * 22}px, ${y * 22}px)`;
        raf = null;
      });
    }, { passive: true });
  }
}

