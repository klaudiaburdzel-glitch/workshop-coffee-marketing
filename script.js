'use strict';

/**
 * Workshop Coffee — Digital Marketing Strategy
 * Lightweight interactions with no external dependencies.
 */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
  const backToTop = document.querySelector('.back-to-top');
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  const counters = Array.from(document.querySelectorAll('.kpi-value[data-count]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------
     Header and back-to-top button
  ------------------------------ */
  const updateScrollUI = () => {
    const isScrolled = window.scrollY > 24;
    header?.classList.toggle('scrolled', isScrolled);
    backToTop?.classList.toggle('visible', window.scrollY > 520);
  };

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  });

  /* -----------------------------
     Mobile navigation
  ------------------------------ */
  const setMenuState = (open) => {
    if (!navToggle || !navMenu) return;

    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    navMenu.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
  };

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuState(false);
      navToggle?.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!navMenu || !navToggle || !navMenu.classList.contains('open')) return;
    if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
      setMenuState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) setMenuState(false);
  });

  /* -----------------------------
     Reveal-on-scroll animation
  ------------------------------ */
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -45px 0px'
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* -----------------------------
     KPI counters
  ------------------------------ */
  const setCounterValue = (element, value) => {
    const prefix = element.dataset.prefix || '';
    const suffix = element.dataset.suffix || '';
    element.textContent = `${prefix}${value}${suffix}`;
  };

  const animateCounter = (element) => {
    if (element.dataset.animated === 'true') return;
    element.dataset.animated = 'true';

    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;

    if (prefersReducedMotion) {
      setCounterValue(element, target);
      return;
    }

    const duration = 1100;
    const startTime = performance.now();

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(target * eased);
      setCounterValue(element, currentValue);

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
  } else {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.55 }
    );

    counters.forEach((counter) => {
      setCounterValue(counter, 0);
      counterObserver.observe(counter);
    });
  }

  /* -----------------------------
     Active navigation link
  ------------------------------ */
  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if ('IntersectionObserver' in window && sections.length) {
    const visibleSections = new Map();

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });

        if (visibleSections.size) {
          const activeSection = [...visibleSections.entries()]
            .sort((a, b) => b[1] - a[1])[0][0];
          setActiveLink(activeSection);
        }
      },
      {
        threshold: [0.15, 0.3, 0.5, 0.7],
        rootMargin: '-20% 0px -55% 0px'
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  } else if (sections[0]) {
    setActiveLink(sections[0].id);
  }

  /* -----------------------------
     Improve in-page focus handling
  ------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;

      window.setTimeout(() => {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener(
          'blur',
          () => target.removeAttribute('tabindex'),
          { once: true }
        );
      }, prefersReducedMotion ? 0 : 450);
    });
  });
});
