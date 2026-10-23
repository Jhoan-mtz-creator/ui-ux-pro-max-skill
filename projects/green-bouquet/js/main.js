/* =========================================================================
   Green Bouquet — animaciones de scroll
   GSAP + ScrollTrigger + Lenis. Solo se animan transform y opacity.

   Regla general: el HTML/CSS ya es una página completa y legible. Este
   archivo solo añade movimiento encima. Si el usuario pide movimiento
   reducido, o las librerías no cargan, la página queda en reposo.
   ========================================================================= */
(() => {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp01 = gsap.utils.clamp(0, 1);

  /* ---------------------------------------------------------------------
     Utilidad: parte un párrafo en palabras para revelarlas con el scroll.
     Se hace una sola vez y se conserva el texto completo para lectores
     de pantalla (las palabras sueltas van con aria-hidden).
     --------------------------------------------------------------------- */
  function splitWords(el) {
    if (el.dataset.split) return $$('.w', el);
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.textContent = '';

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
    el.appendChild(sr);

    text.split(' ').forEach((word, i) => {
      if (i) el.appendChild(document.createTextNode(' '));
      const span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      el.appendChild(span);
    });
    el.dataset.split = 'true';
    return $$('.w', el);
  }

  /* ---------------------------------------------------------------------
     Lenis: scroll suave sincronizado con el ticker de GSAP, para que
     ScrollTrigger y Lenis lean el mismo frame (sin "temblores").
     --------------------------------------------------------------------- */
  function initLenis() {
    if (!window.Lenis) return () => {};

    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = (time) => lenis.raf(time * 1000);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Enlaces internos (#servicios, #contacto...) con el mismo scroll suave
    const onClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const target = link.getAttribute('href') === '#top' ? 0 : $(link.getAttribute('href'));
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(2, -10 * t) });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }

  /* ---------------------------------------------------------------------
     1. Hero — la placa 3D gira y sus capas se separan en Z.
     Parallax de 2 capas: el texto sube lento, el objeto sube más rápido.
     --------------------------------------------------------------------- */
  function hero(desktop) {
    const k = desktop ? 1 : 0.5; // en móvil, la mitad de rotación y profundidad

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
    });

    tl.fromTo('.slab',
        { rotateX: 18, rotateY: -24, z: 0 },
        { rotateX: 18 - 28 * k, rotateY: -24 + 38 * k, z: -240 * k, ease: 'power2.inOut' }, 0)
      .fromTo('.slab__layer--mid', { z: 26 }, { z: 26 + 50 * k }, 0)
      .fromTo('.slab__layer--top', { z: 52 }, { z: 52 + 110 * k }, 0)
      .fromTo('.slab__layer--top img', { scale: 1.12 }, { scale: 1 }, 0) // la foto "respira" dentro de su marco
      .to('.hero__copy', { yPercent: -14, opacity: 0.2 }, 0)
      .to('.hero__stage', { yPercent: -28 * k }, 0)
      .to('.hero__hint', { opacity: 0, duration: 0.15 }, 0);
  }

  /* ---------------------------------------------------------------------
     2. Concepto — el bloque entra desde el fondo (z negativo + rotateX)
     y, ya fijado, cada palabra se enciende con el progreso del scroll.
     --------------------------------------------------------------------- */
  function concept(desktop) {
    const words = splitWords($('[data-words]'));

    gsap.fromTo('.concept__inner',
      { rotateX: desktop ? 16 : 8, z: desktop ? -200 : 0, y: desktop ? 0 : 40, opacity: 0.3, transformOrigin: '50% 100%' },
      {
        rotateX: 0, z: 0, y: 0, opacity: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.concept', start: 'top bottom', end: desktop ? 'top top' : 'top 40%', scrub: 1 },
      });

    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.06,
      scrollTrigger: desktop
        ? { trigger: '.concept', start: 'top top', end: '+=110%', scrub: 1, pin: true }
        : { trigger: '.concept__text', start: 'top 80%', end: 'bottom 50%', scrub: 1 },
    });
  }

  /* ---------------------------------------------------------------------
     3. Servicios — cada card se "levanta" del plano: viene inclinada y
     hundida, termina plana. La sombra (capa aparte) aparece a la vez.
     En escritorio, hover con inclinación mínima siguiendo el puntero.
     --------------------------------------------------------------------- */
  function services(desktop, cleanups) {
    const cards = $$('[data-card]');
    // Las imágenes cambian alturas al cargar: recalcular posiciones
    $$('img[loading="lazy"]').forEach((img) => img.complete || img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));
    const cols = getComputedStyle($('.cards')).gridTemplateColumns.split(' ').length;

    cards.forEach((card, i) => {
      const offset = (i % cols) * 70; // escalonado por columna, en px de scroll

      gsap.timeline({
        scrollTrigger: { trigger: card, start: `top+=${offset} bottom`, end: `top+=${offset} 55%`, scrub: 1 },
      })
        .fromTo(card,
          { rotateX: desktop ? 28 : 10, z: desktop ? -220 : 0, y: desktop ? 140 : 60, opacity: 0, transformOrigin: '50% 100%' },
          { rotateX: 0, z: 0, y: 0, opacity: 1, ease: 'power3.out' }, 0)
        .fromTo($('.card__shadow', card), { opacity: 0 }, { opacity: 1, ease: 'power2.out' }, 0);
    });

    if (!desktop || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    cards.forEach((card) => {
      const body = $('.card__body', card);
      const rx = gsap.quickTo(body, 'rotateX', { duration: 0.8, ease: 'power3.out' });
      const ry = gsap.quickTo(body, 'rotateY', { duration: 0.8, ease: 'power3.out' });
      const tz = gsap.quickTo(body, 'z', { duration: 0.8, ease: 'power3.out' });

      const move = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;  // -0.5 … 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 6);   // máximo ±3°
        rx(-py * 6);
        tz(24);
      };
      const leave = () => { rx(0); ry(0); tz(0); };

      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', leave);
        gsap.set(body, { clearProps: 'transform' });
      });
    });
  }

  /* ---------------------------------------------------------------------
     4. Proceso — escritorio: túnel en Z. Los pasos están apilados en
     profundidad (z = -i * D) y la "cámara" (el contenedor) avanza.
     El easing por tramo hace que la cámara se detenga en cada paso.
     Móvil: lista vertical con aparición simple.
     --------------------------------------------------------------------- */
  function process(desktop, cleanups) {
    const section = $('.process');
    const steps = $$('.step', section);
    const n = steps.length;

    if (!desktop) {
      steps.forEach((step) => {
        gsap.fromTo(step, { y: 50, opacity: 0 }, {
          y: 0, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: step, start: 'top 92%', end: 'top 65%', scrub: 1 },
        });
      });
      return;
    }

    section.classList.add('is-tunnel');
    cleanups.push(() => section.classList.remove('is-tunnel'));

    const D = 900; // distancia entre pasos en px de profundidad
    const tunnel = $('.tunnel', section);
    const counter = $('[data-step-current]', section);
    const bar = $('.process__bar i', section);
    const dwell = gsap.parseEase('power2.inOut');

    // Alterna los pasos a izquierda/derecha para que la profundidad se lea
    steps.forEach((step, i) => {
      gsap.set(step, { xPercent: -50 + (i % 2 ? 16 : -16), yPercent: -50, z: -i * D });
    });

    const setZ = gsap.quickSetter(tunnel, 'z', 'px');
    const setBar = gsap.quickSetter(bar, 'scaleX');
    const setOpacity = steps.map((s) => gsap.quickSetter(s, 'opacity'));
    let lastIndex = -1;

    const state = { t: 0 };
    const render = () => {
      const base = Math.floor(state.t);
      const cam = Math.min(base + dwell(state.t - base), n - 1);

      setZ(cam * D);
      setBar(cam / (n - 1));

      steps.forEach((_, i) => {
        const d = i - cam; // <0: ya pasó la cámara · >0: está más al fondo
        setOpacity[i](clamp01(d < 0 ? 1 + d * 2.5 : 1 - d * 0.5));
      });

      const index = Math.round(cam);
      if (index !== lastIndex) {
        counter.textContent = String(index + 1).padStart(2, '0');
        lastIndex = index;
      }
    };

    gsap.to(state, {
      t: n - 1,
      ease: 'none',
      onUpdate: render,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * (n - 1) * 0.9}`,
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
      },
    });
    render();

    cleanups.push(() => {
      gsap.set([tunnel, bar, ...steps], { clearProps: 'all' });
      counter.textContent = '01';
    });
  }

  /* ---------------------------------------------------------------------
     5. La finca — parallax de 3 capas: la foto aérea se desplaza dentro de
     su marco (capa lenta), el retrato del corte sube más rápido (capa
     rápida) y el texto se queda en su lugar. El marco aéreo se eleva con
     un leve giro en Y al entrar.
     --------------------------------------------------------------------- */
  function farm(desktop) {
    const section = $('.farm');
    const k = desktop ? 1 : 0.4;
    const scrub = { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true };

    gsap.fromTo('[data-inner-parallax]', { yPercent: 0 }, { yPercent: -15, ease: 'none', scrollTrigger: scrub });

    $$('[data-parallax]', section).forEach((el) => {
      const amount = parseFloat(el.dataset.parallax) * k;
      gsap.fromTo(el, { yPercent: -amount / 2 }, { yPercent: amount / 2, ease: 'none', scrollTrigger: scrub });
    });

    gsap.fromTo('[data-lift]',
      { rotateY: desktop ? -12 : 0, rotateX: desktop ? 6 : 4, z: desktop ? -120 : 0, opacity: 0, transformPerspective: 1400 },
      {
        rotateY: 0, rotateX: 0, z: 0, opacity: 1, ease: 'expo.out',
        scrollTrigger: { trigger: '[data-lift]', start: 'top 95%', end: 'top 45%', scrub: 1 },
      });
  }

  /* ---------------------------------------------------------------------
     Títulos — aparecen con rotación leve en X desde la base de la línea.
     --------------------------------------------------------------------- */
  function headings(desktop) {
    $$('[data-reveal]').forEach((el) => {
      gsap.fromTo(el,
        { rotateX: desktop ? 35 : 15, y: 40, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 900 },
        {
          rotateX: 0, y: 0, opacity: 1, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 62%', scrub: 1 },
        });
    });

    gsap.fromTo('[data-rise]',
      { yPercent: 35, rotateX: desktop ? -30 : -12, opacity: 0, transformOrigin: '50% 0%' },
      {
        yPercent: 0, rotateX: 0, opacity: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.footer', start: 'top 90%', end: 'top 35%', scrub: 1 },
      });
  }

  /* ---------------------------------------------------------------------
     Orquestación — gsap.matchMedia crea y destruye todo según el ancho y
     la preferencia de movimiento. Al cambiar de condición (rotar el
     teléfono, activar "reducir movimiento"), GSAP revierte las animaciones
     y ScrollTriggers creados dentro, y nuestros cleanups hacen el resto.
     --------------------------------------------------------------------- */
  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      mobile: '(max-width: 899.98px)',
      reduce: '(prefers-reduced-motion: reduce)',
    },
    (ctx) => {
      const { desktop, reduce } = ctx.conditions;
      if (reduce) return; // estado de reposo definido en CSS

      const cleanups = [initLenis()];

      hero(desktop);
      concept(desktop);
      services(desktop, cleanups);
      process(desktop, cleanups);
      farm(desktop);
      headings(desktop);

      return () => cleanups.forEach((fn) => fn());
    }
  );

  // Las fuentes cambian alturas: recalcular posiciones cuando terminen de cargar
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
