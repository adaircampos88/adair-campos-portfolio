(() => {
  const root = document.documentElement;
  const toggles = document.querySelectorAll('.theme-toggle');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The inline head script sets the initial theme before paint. This is a safe fallback.
  if (!root.dataset.theme) {
    try {
      const saved = localStorage.getItem('portfolio-theme');
      root.dataset.theme = saved === 'dark' || saved === 'light'
        ? saved
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (error) { root.dataset.theme = 'light'; }
  }

  const getTheme = () => root.dataset.theme || 'light';
  const updateToggles = () => {
    const dark = getTheme() === 'dark';
    toggles.forEach((button) => {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      const icon = button.querySelector('.theme-toggle-icon');
      if (icon) icon.textContent = dark ? '☀' : '☾';
    });
  };

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('portfolio-theme', next); } catch (error) {}
      updateToggles();
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  systemTheme.addEventListener?.('change', (event) => {
    try {
      if (!localStorage.getItem('portfolio-theme')) {
        root.dataset.theme = event.matches ? 'dark' : 'light';
        updateToggles();
      }
    } catch (error) {}
  });
    });
  });
  updateToggles();

  const revealItems = document.querySelectorAll('.reveal');
  if (motionQuery.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  }

  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = max > 0 ? `${Math.min(100, (window.scrollY / max) * 100)}%` : '0%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // Accessibility preferences panel
  const a11yPreferences = {
    contrast: { attribute: 'data-a11y-contrast', value: 'high' },
    motion: { attribute: 'data-a11y-motion', value: 'reduced' },
    font: { attribute: 'data-a11y-font', value: 'readable' },
    spacing: { attribute: 'data-a11y-spacing', value: 'increased' },
    links: { attribute: 'data-a11y-links', value: 'underlined' }
  };

  const getStoredA11y = () => {
    try { return JSON.parse(localStorage.getItem('portfolio-a11y') || '{}'); }
    catch (error) { return {}; }
  };
  const saveA11y = (settings) => {
    try { localStorage.setItem('portfolio-a11y', JSON.stringify(settings)); }
    catch (error) {}
  };
  let a11ySettings = getStoredA11y();

  const applyA11ySettings = () => {
    Object.entries(a11yPreferences).forEach(([key, config]) => {
      if (a11ySettings[key]) root.setAttribute(config.attribute, config.value);
      else root.removeAttribute(config.attribute);
    });
    document.querySelectorAll('[data-a11y-setting]').forEach((button) => {
      const key = button.dataset.a11ySetting;
      button.setAttribute('aria-pressed', String(Boolean(a11ySettings[key])));
    });
  };

  const launcher = document.createElement('button');
  launcher.className = 'a11y-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Open accessibility settings');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'a11yPanel');
  launcher.innerHTML = '<svg aria-hidden="true" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="6" r="3" fill="currentColor"/><path d="M6 11.5c6.5 2 13.5 2 20 0M16 10v8m0 0-6 9m6-9 6 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const panel = document.createElement('section');
  panel.className = 'a11y-panel';
  panel.id = 'a11yPanel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'a11yPanelTitle');
  panel.setAttribute('aria-describedby', 'a11yPanelDescription');
  panel.innerHTML = `
    <div class="a11y-panel-head">
      <div><h2 id="a11yPanelTitle">Accessibility</h2><p id="a11yPanelDescription">Adjust the portfolio to make it more comfortable to read and navigate.</p></div>
      <button class="a11y-close" type="button" aria-label="Close accessibility settings">×</button>
    </div>
    <div class="a11y-options">
      <button class="a11y-option" type="button" data-a11y-setting="contrast" aria-pressed="false">
        <span class="a11y-option-icon" aria-hidden="true">◐</span><span class="a11y-option-copy"><strong>High contrast</strong><small>Strengthens foreground and background separation.</small></span><span class="a11y-switch" aria-hidden="true"></span>
      </button>
      <button class="a11y-option" type="button" data-a11y-setting="motion" aria-pressed="false">
        <span class="a11y-option-icon" aria-hidden="true">▶</span><span class="a11y-option-copy"><strong>Reduce motion</strong><small>Minimises animation and scrolling effects.</small></span><span class="a11y-switch" aria-hidden="true"></span>
      </button>
      <button class="a11y-option" type="button" data-a11y-setting="font" aria-pressed="false">
        <span class="a11y-option-icon" aria-hidden="true">Aa</span><span class="a11y-option-copy"><strong>Readable type</strong><small>Uses a wider, familiar system typeface.</small></span><span class="a11y-switch" aria-hidden="true"></span>
      </button>
      <button class="a11y-option" type="button" data-a11y-setting="spacing" aria-pressed="false">
        <span class="a11y-option-icon" aria-hidden="true">↕</span><span class="a11y-option-copy"><strong>Increase spacing</strong><small>Adds line, letter and word spacing.</small></span><span class="a11y-switch" aria-hidden="true"></span>
      </button>
      <button class="a11y-option" type="button" data-a11y-setting="links" aria-pressed="false">
        <span class="a11y-option-icon" aria-hidden="true">_</span><span class="a11y-option-copy"><strong>Underline links</strong><small>Makes text links easier to identify.</small></span><span class="a11y-switch" aria-hidden="true"></span>
      </button>
    </div>
    <button class="a11y-reset" type="button">Reset accessibility settings</button>
    <p class="a11y-panel-note">These preferences are stored only in this browser and can be reset at any time.</p>`;

  const a11yStatus = document.createElement('p');
  a11yStatus.className = 'sr-only';
  a11yStatus.setAttribute('role', 'status');
  a11yStatus.setAttribute('aria-live', 'polite');
  document.body.append(launcher, panel, a11yStatus);
  const closeButton = panel.querySelector('.a11y-close');
  const resetButton = panel.querySelector('.a11y-reset');
  const settingButtons = panel.querySelectorAll('[data-a11y-setting]');

  const openA11yPanel = () => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  };
  const closeA11yPanel = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  };
  launcher.addEventListener('click', () => panel.hidden ? openA11yPanel() : closeA11yPanel());
  closeButton.addEventListener('click', closeA11yPanel);
  settingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.a11ySetting;
      a11ySettings[key] = !a11ySettings[key];
      saveA11y(a11ySettings);
      applyA11ySettings();
      const label = button.querySelector('strong')?.textContent || 'Accessibility preference';
      a11yStatus.textContent = `${label} ${a11ySettings[key] ? 'enabled' : 'disabled'}.`;
    });
  });
  resetButton.addEventListener('click', () => {
    a11ySettings = {};
    saveA11y(a11ySettings);
    applyA11ySettings();
    a11yStatus.textContent = 'Accessibility settings reset.';
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closeA11yPanel();
    if (event.key === 'Tab' && !panel.hidden && panel.contains(document.activeElement)) {
      const focusable = [...panel.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !launcher.contains(event.target)) {
      panel.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
    }
  });
  applyA11ySettings();

})();

(() => {
  const header = document.querySelector('.airbnb-header');
  if (header) {
    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  const setActiveNavigation = (key) => {
    document.querySelectorAll('[data-nav-key], [data-mobile-nav]').forEach((link) => {
      const matches = (link.dataset.navKey || link.dataset.mobileNav) === key;
      link.classList.toggle('is-active', matches);
      if (matches) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  if (document.body.classList.contains('home-page')) {
    const sections = [
      ['home', document.querySelector('#top')],
      ['work', document.querySelector('#work')],
      ['about', document.querySelector('#about')],
      ['contact', document.querySelector('#contact')]
    ].filter(([, section]) => section);

    if ('IntersectionObserver' in window) {
      const visible = new Map();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => visible.set(entry.target, entry.intersectionRatio));
        let best = null;
        let ratio = 0;
        sections.forEach(([key, section]) => {
          const value = visible.get(section) || 0;
          if (value > ratio) { best = key; ratio = value; }
        });
        if (best) setActiveNavigation(best);
      }, { rootMargin: '-22% 0px -55% 0px', threshold: [0, .08, .2, .5, .8] });
      sections.forEach(([, section]) => observer.observe(section));
    }
  }
})();
