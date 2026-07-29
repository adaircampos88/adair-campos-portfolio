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
    });
  });
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  systemTheme.addEventListener?.('change', (event) => {
    try {
      if (!localStorage.getItem('portfolio-theme')) {
        root.dataset.theme = event.matches ? 'dark' : 'light';
        updateToggles();
      }
    } catch (error) {}
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
  const config = window.PORTFOLIO_CONFIG || {};
  if (config.analyticsEnabled === false) return;

  const consentKey = 'portfolioAnalyticsConsent:v1';
  const isLegalPage = document.body.classList.contains('legal-page');
  const measurementId = String(config.analyticsMeasurementId || '').trim();
  const hasValidMeasurementId = /^G-[A-Z0-9]+$/i.test(measurementId) && !measurementId.includes('TODO');
  const readConsent = () => {
    try {
      const value = localStorage.getItem(consentKey);
      return value === 'accepted' || value === 'rejected' ? value : 'unknown';
    } catch (error) { return 'unknown'; }
  };
  const saveConsent = (value) => {
    try { localStorage.setItem(consentKey, value); } catch (error) {}
  };

  let analyticsLoaded = false;
  const loadAnalytics = () => {
    if (isLegalPage || analyticsLoaded || !hasValidMeasurementId || readConsent() !== 'accepted') return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.portfolioAnalytics = 'true';
    document.head.append(script);
  };

  const banner = document.createElement('section');
  banner.className = 'consent-banner';
  banner.hidden = true;
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-labelledby', 'consentTitle');
  banner.setAttribute('aria-describedby', 'consentDescription');
  banner.innerHTML = `
    <div class="consent-copy">
      <p class="consent-kicker">Your privacy</p>
      <h2 id="consentTitle">Can I learn what’s useful?</h2>
      <p id="consentDescription">I’d like to use optional Google Analytics to see which projects receive the most attention and improve the experience. It stays off unless you allow it, and you can change your choice anytime. <a href="privacy.html">How it works</a></p>
      <p class="consent-status" aria-live="polite"></p>
    </div>
    <div class="consent-actions">
      <button class="consent-action consent-accept" type="button">Allow analytics</button>
      <button class="consent-action consent-decline" type="button">No, thanks</button>
    </div>`;
  document.body.append(banner);

  const status = banner.querySelector('.consent-status');
  const acceptButton = banner.querySelector('.consent-accept');
  const declineButton = banner.querySelector('.consent-decline');
  const settingsButtons = [...document.querySelectorAll('.cookie-settings-button')];
  if (!settingsButtons.length) {
    const footerLinks = document.querySelector('footer .footer-links');
    if (footerLinks) {
      const button = document.createElement('button');
      button.className = 'cookie-settings-button';
      button.type = 'button';
      button.textContent = 'Cookie settings';
      footerLinks.append(button);
      settingsButtons.push(button);
    }
  }

  const updateStatus = () => {
    const choice = readConsent();
    status.textContent = choice === 'accepted'
      ? 'Analytics are on. Choose “No, thanks” to turn them off.'
      : choice === 'rejected'
        ? 'Analytics are off. You can change this anytime.'
        : 'Optional · No choice saved yet.';
  };
  const openPreferences = () => {
    updateStatus();
    banner.hidden = false;
    document.body.classList.add('consent-visible');
    acceptButton.focus();
  };
  const closePreferences = () => {
    banner.hidden = true;
    document.body.classList.remove('consent-visible');
  };
  const clearAnalyticsCookies = () => {
    const hostname = window.location.hostname;
    document.cookie.split(';').forEach((entry) => {
      const name = entry.split('=')[0].trim();
      if (!name.startsWith('_ga')) return;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      if (hostname) document.cookie = `${name}=; Max-Age=0; path=/; domain=${hostname}; SameSite=Lax`;
    });
  };

  acceptButton.addEventListener('click', () => {
    saveConsent('accepted');
    updateStatus();
    loadAnalytics();
    closePreferences();
  });
  declineButton.addEventListener('click', () => {
    const wasLoaded = analyticsLoaded;
    saveConsent('rejected');
    clearAnalyticsCookies();
    closePreferences();
    if (wasLoaded) window.location.reload();
  });
  settingsButtons.forEach((button) => button.addEventListener('click', openPreferences));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !banner.hidden && readConsent() !== 'unknown') closePreferences();
  });

  document.addEventListener('click', (event) => {
    if (isLegalPage || readConsent() !== 'accepted' || typeof window.gtag !== 'function') return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    let eventName = '';
    let eventLabel = href;
    if (/case-study-[^#?]+\.html/i.test(href)) eventName = 'case_study_open';
    else if (/\.pdf(?:$|[?#])/i.test(href) || link.hasAttribute('download')) eventName = 'cv_download';
    else if (href.startsWith('mailto:')) eventName = 'contact_click';
    else if (/linkedin\.com/i.test(href)) eventName = 'linkedin_click';
    if (eventName) window.gtag('event', eventName, { link_url: eventLabel });
  });

  const choice = readConsent();
  if (choice === 'accepted') loadAnalytics();
  else if (choice === 'unknown' && !isLegalPage) openPreferences();
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

(() => {
  const prototype = document.querySelector('[data-energy-prototype]');
  if (!prototype) return;

  const dashboard = prototype.querySelector('[data-energy-dashboard]');
  const tabs = [...prototype.querySelectorAll('[data-energy-view]')];
  const nodes = [...prototype.querySelectorAll('[data-energy-node]')];
  const paths = new Map([...prototype.querySelectorAll('[data-flow-path]')].map((path) => [path.dataset.flowPath, path]));
  const valueElements = new Map([...prototype.querySelectorAll('[data-energy-value]')].map((element) => [element.dataset.energyValue, element]));
  const stateElements = new Map([...prototype.querySelectorAll('[data-energy-state]')].map((element) => [element.dataset.energyState, element]));
  const statElements = new Map([...prototype.querySelectorAll('[data-energy-stat]')].map((element) => [element.dataset.energyStat, element]));
  const insightLabel = prototype.querySelector('[data-energy-insight-label]');
  const insight = prototype.querySelector('[data-energy-insight]');
  const weatherIcon = prototype.querySelector('[data-weather-icon]');
  const weatherTemp = prototype.querySelector('[data-weather-temp]');
  const weatherLabel = prototype.querySelector('[data-weather-label]');
  const chips = [...prototype.querySelectorAll('.floating-chip')];
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.a11yMotion === 'reduced';

  let mode = 'flow';
  let selectedNode = null;
  let weather = { temperature: null, weatherCode: 1, cloudCover: 28, source: 'simulation' };
  let model = null;

  const number = (value) => Math.max(0, Number(value) || 0);
  const kw = (value) => number(value).toFixed(2);
  const munichHour = () => Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23'
  }).format(new Date()));

  const describeWeather = (code) => {
    if (code === 0) return ['☀', 'Clear'];
    if ([1, 2].includes(code)) return ['🌤', 'Partly cloudy'];
    if (code === 3) return ['☁', 'Cloudy'];
    if ([45, 48].includes(code)) return ['≋', 'Foggy'];
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['☂', 'Rain'];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ['❄', 'Snow'];
    if ([95, 96, 99].includes(code)) return ['ϟ', 'Storm'];
    return ['◌', 'Current'];
  };

  const calculateModel = () => {
    const hour = munichHour();
    const daylight = hour >= 6 && hour <= 20 ? Math.sin(((hour - 6) / 14) * Math.PI) : 0;
    const cloudFactor = Math.max(.16, 1 - (number(weather.cloudCover) / 100) * .72);
    const solar = Math.max(0, 9.4 * daylight * cloudFactor);
    const morningPeak = hour >= 6 && hour < 9 ? 1.05 : 0;
    const eveningPeak = hour >= 17 && hour < 23 ? 1.65 : 0;
    const overnight = hour < 6 || hour >= 23 ? .42 : 0;
    const homeBase = 1.18 + morningPeak + eveningPeak + overnight;
    const evLoad = mode === 'ev' ? 2.35 : 0;
    const home = homeBase + evLoad;
    const surplus = solar - home;
    const battery = surplus > .2 ? Math.min(2.1, surplus * .58) : -Math.min(1.65, Math.abs(surplus) * .62);
    const grid = solar - home - Math.max(0, battery) + Math.max(0, -battery);
    const daylightHours = Math.max(0, Math.min(14, hour - 6));
    const dailyYield = solar === 0 ? Math.max(0, daylightHours * 2.6 * cloudFactor) : daylightHours * (solar * .44 + 1.1);
    const selfConsumption = solar > .01 ? Math.min(100, ((Math.min(solar, home) + Math.max(0, battery)) / solar) * 100) : 100;
    return { hour, solar, home, battery, grid, dailyYield, selfConsumption, saved: dailyYield * .19 };
  };

  const setPath = (key, active, reverse = false) => {
    const path = paths.get(key);
    if (!path) return;
    path.classList.toggle('active', active);
    path.classList.toggle('idle', !active);
    path.classList.toggle('energy-reverse', reverse);
    path.classList.toggle('is-muted', mode === 'dashboard');
  };

  const setInsight = (label, message) => {
    if (insightLabel) insightLabel.textContent = label;
    if (insight) insight.textContent = message;
  };

  const nodeInsight = (key) => {
    if (!model) return;
    const messages = {
      solar: ['Solar generation', model.solar > .05 ? `${kw(model.solar)} kW is being produced using Munich’s current daylight and cloud cover.` : 'Solar production is resting outside daylight hours.'],
      home: ['Home demand', `${kw(model.home)} kW is powering the household${mode === 'ev' ? ', including the active EV charging session' : ''}.`],
      battery: ['Battery intelligence', model.battery >= 0 ? `${kw(model.battery)} kW of available surplus is charging the battery.` : `${kw(Math.abs(model.battery))} kW is being released to reduce grid demand.`],
      grid: ['Grid exchange', model.grid >= 0 ? `${kw(model.grid)} kW of surplus energy is being exported to the grid.` : `${kw(Math.abs(model.grid))} kW is being imported to balance demand.`]
    };
    setInsight(...messages[key]);
  };

  const render = () => {
    model = calculateModel();
    dashboard.dataset.energyMode = mode;

    valueElements.get('solar').textContent = kw(model.solar);
    valueElements.get('home').textContent = kw(model.home);
    valueElements.get('battery').textContent = kw(Math.abs(model.battery));
    valueElements.get('grid').textContent = kw(Math.abs(model.grid));
    stateElements.get('solar').textContent = model.solar > .05 ? 'Generating' : 'Standby';
    stateElements.get('home').textContent = mode === 'ev' ? 'Home + EV demand' : 'Consuming';
    stateElements.get('battery').textContent = model.battery >= 0 ? 'Charging · 71%' : 'Supporting · 71%';
    stateElements.get('grid').textContent = model.grid >= 0 ? 'Exporting' : 'Importing';
    statElements.get('yield').textContent = `${model.dailyYield.toFixed(1)} kWh`;
    statElements.get('self').textContent = `${Math.round(model.selfConsumption)}%`;
    statElements.get('saved').textContent = `€${model.saved.toFixed(2)}`;

    setPath('solar-home', model.solar > .05);
    setPath('solar-grid', model.grid > .08 && model.solar > .05);
    setPath('battery-home', model.battery < -.05);
    setPath('home-grid', Math.abs(model.grid) > .08, model.grid < 0);

    nodes.forEach((node) => {
      const key = node.dataset.energyNode;
      const active = key === 'home' || (key === 'solar' && model.solar > .05) || (key === 'battery' && Math.abs(model.battery) > .05) || (key === 'grid' && Math.abs(model.grid) > .05);
      node.classList.toggle('active-node', active);
      node.classList.toggle('is-selected', selectedNode === key);
      node.setAttribute('aria-pressed', String(selectedNode === key));
    });

    if (selectedNode) nodeInsight(selectedNode);
    else if (mode === 'ev') setInsight('Smart charging', 'The EV session adds 2.35 kW of demand while the system automatically balances solar, battery and grid energy.');
    else if (mode === 'dashboard') setInsight('Today at a glance', `${model.dailyYield.toFixed(1)} kWh generated with ${Math.round(model.selfConsumption)}% used or stored locally.`);
    else if (model.grid >= 0) setInsight('Live balance', 'Solar is meeting current home demand and the remaining energy is being stored or exported.');
    else setInsight('Live balance', 'The battery and grid are supporting the home while solar production is below current demand.');
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    mode = tab.dataset.energyView;
    selectedNode = null;
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    render();
  }));

  nodes.forEach((node) => node.addEventListener('click', () => {
    const key = node.dataset.energyNode;
    selectedNode = selectedNode === key ? null : key;
    render();
  }));

  const loadMunichWeather = async () => {
    try {
      const endpoint = 'https://api.open-meteo.com/v1/forecast?latitude=48.1374&longitude=11.5755&current=temperature_2m,weather_code,cloud_cover&timezone=Europe%2FBerlin';
      const response = await fetch(endpoint, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
      const data = await response.json();
      weather = {
        temperature: Number(data.current?.temperature_2m),
        weatherCode: Number(data.current?.weather_code ?? 1),
        cloudCover: Number(data.current?.cloud_cover ?? 28),
        source: 'Open-Meteo'
      };
      const [icon, label] = describeWeather(weather.weatherCode);
      weatherIcon.textContent = icon;
      weatherTemp.textContent = `${Math.round(weather.temperature)}°`;
      weatherLabel.textContent = `${label} · Munich`;
      render();
    } catch (error) {
      const [icon] = describeWeather(weather.weatherCode);
      weatherIcon.textContent = icon;
      weatherTemp.textContent = `${munichHour()}:00`;
      weatherLabel.textContent = 'Munich time';
      render();
    }
  };

  let pointerFrame = 0;
  const resetChips = () => chips.forEach((chip) => {
    chip.style.setProperty('--chip-x', '0px');
    chip.style.setProperty('--chip-y', '0px');
    chip.style.setProperty('--chip-opacity', '1');
    chip.style.setProperty('--chip-scale', '1');
    chip.classList.remove('is-dispersing');
  });
  const moveChips = (clientX, clientY) => {
    if (reducedMotion() || !window.matchMedia('(pointer:fine)').matches) return resetChips();
    chips.forEach((chip) => {
      const rect = chip.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - clientX;
      const dy = rect.top + rect.height / 2 - clientY;
      const distance = Math.hypot(dx, dy);
      const radius = 165;
      const strength = Math.max(0, 1 - distance / radius);
      const directionX = distance ? dx / distance : 1;
      const directionY = distance ? dy / distance : 0;
      chip.style.setProperty('--chip-x', `${(directionX * strength * 42).toFixed(1)}px`);
      chip.style.setProperty('--chip-y', `${(directionY * strength * 42).toFixed(1)}px`);
      chip.style.setProperty('--chip-opacity', String(Math.max(.04, 1 - strength * 1.35)));
      chip.style.setProperty('--chip-scale', String(1 - strength * .08));
      chip.classList.toggle('is-dispersing', strength > .18);
    });
  };
  prototype.addEventListener('pointermove', (event) => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => moveChips(event.clientX, event.clientY));
  });
  prototype.addEventListener('pointerleave', resetChips);

  render();
  loadMunichWeather();
  window.setInterval(() => { render(); loadMunichWeather(); }, 15 * 60 * 1000);
})();
