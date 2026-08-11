(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionIsReduced = () => reduceMotion.matches || root.dataset.a11yMotion === 'reduced';

  const chapterPanels = [...document.querySelectorAll('[data-chapter-panel]')];
  const chapterOpeners = [...document.querySelectorAll('[data-chapter-open]')];
  const sectionNav = document.querySelector('.case-context-nav');
  const sectionLinks = [...document.querySelectorAll('[data-case-section-link]')];
  const readingSections = sectionLinks
    .map((link) => [link.dataset.caseSectionLink, document.getElementById(link.dataset.caseSectionLink)])
    .filter(([, section]) => section);

  let activeSectionId = '';
  const setActiveSection = (sectionId) => {
    if (sectionId === activeSectionId) return;
    activeSectionId = sectionId;
    let activeLink;
    sectionLinks.forEach((link) => {
      const active = link.dataset.caseSectionLink === sectionId;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      if (active) activeLink = link;
    });
    activeLink?.scrollIntoView({
      behavior: motionIsReduced() ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  };

  let sectionUpdateFrame = 0;
  const updateActiveSection = () => {
    sectionUpdateFrame = 0;
    if (!readingSections.length) return;
    const navBottom = sectionNav?.getBoundingClientRect().bottom || 0;
    const activationLine = Math.max(navBottom + 18, window.innerHeight * .18);
    let activeId = readingSections[0][0];
    readingSections.forEach(([sectionId, section]) => {
      if (section.getBoundingClientRect().top <= activationLine) activeId = sectionId;
    });
    setActiveSection(activeId);
  };

  const requestSectionUpdate = () => {
    if (sectionUpdateFrame) return;
    sectionUpdateFrame = window.requestAnimationFrame(updateActiveSection);
  };

  const scrollToChapter = (chapter) => {
    const selectedPanel = chapterPanels.find((panel) => panel.dataset.chapterPanel === chapter);
    if (!selectedPanel) return;
    history.replaceState(null, '', `#${selectedPanel.id}`);
    selectedPanel.scrollIntoView({
      behavior: motionIsReduced() ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  chapterOpeners.forEach((button) => button.addEventListener('click', () => scrollToChapter(button.dataset.chapterOpen)));
  sectionLinks.forEach((link) => link.addEventListener('click', () => setActiveSection(link.dataset.caseSectionLink)));
  window.addEventListener('scroll', requestSectionUpdate, { passive: true });
  window.addEventListener('resize', requestSectionUpdate);
  window.addEventListener('hashchange', requestSectionUpdate);
  requestSectionUpdate();

  const requirementCopy = {
    clarity: {
      title: 'Lead with a plain-language system state.',
      text: 'The interface should answer “Is everything working?” before presenting detailed measurements.'
    },
    expertise: {
      title: 'Keep the default simple, then reveal technical depth.',
      text: 'Progressive disclosure lets casual homeowners and experienced energy users begin from the same coherent overview.'
    },
    trust: {
      title: 'Only show relationships the system can explain accurately.',
      text: 'Connections, device states and energy direction must reflect the real installation instead of creating a persuasive but misleading diagram.'
    },
    scale: {
      title: 'Build a model that adapts as the household changes.',
      text: 'The structure must support solar-only homes as well as systems that add storage, EV charging and controllable devices.'
    }
  };
  const requirementButtons = [...document.querySelectorAll('[data-requirement]')];
  const requirementResponse = document.querySelector('.lab-requirement-response');
  const requirementTitle = document.getElementById('requirementResponseTitle');
  const requirementText = document.getElementById('requirementResponseText');

  const selectRequirement = (key) => {
    const content = requirementCopy[key];
    if (!content) return;
    requirementButtons.forEach((button) => {
      const active = button.dataset.requirement === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (requirementTitle) requirementTitle.textContent = content.title;
    if (requirementText) requirementText.textContent = content.text;
    requirementResponse?.animate?.(
      [{ opacity: .55, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: motionIsReduced() ? 0 : 240, easing: 'ease-out' }
    );
  };
  requirementButtons.forEach((button) => {
    const activate = () => selectRequirement(button.dataset.requirement);
    button.addEventListener('pointerenter', activate);
    button.addEventListener('focus', activate);
    button.addEventListener('click', activate);
  });

  const systemCopy = {
    home: {
      label: 'Home as the anchor',
      title: 'Organise the model around household demand.',
      text: 'Devices and energy sources become easier to understand when their relationship to the home remains stable.'
    },
    solar: {
      label: 'Generation state',
      title: 'Show solar only when it is actively producing.',
      text: 'The connection should communicate direction and current contribution without forcing the user to decode technical topology.'
    },
    battery: {
      label: 'Storage state',
      title: 'Explain whether energy is entering or leaving storage.',
      text: 'Charging, discharging and state of charge are separate ideas that need a clear, consistent relationship.'
    },
    grid: {
      label: 'Grid exchange',
      title: 'Make importing and exporting immediately distinct.',
      text: 'Direction matters more than the existence of the connection because it changes what the household is paying or returning.'
    },
    ev: {
      label: 'Flexible demand',
      title: 'Treat EV charging as part of the household system.',
      text: 'The model can expand to additional devices without changing the home-centred reading order.'
    }
  };
  const systemArt = document.querySelector('.lab-system-art');
  const systemNodes = [...document.querySelectorAll('[data-system-node]')];
  const systemNarrativeLabel = document.getElementById('systemNarrativeLabel');
  const systemNarrativeTitle = document.getElementById('systemNarrativeTitle');
  const systemNarrativeText = document.getElementById('systemNarrativeText');

  const selectSystem = (key) => {
    const content = systemCopy[key];
    if (!content || !systemArt) return;
    systemArt.dataset.activeSystem = key;
    systemNodes.forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.systemNode === key)));
    if (systemNarrativeLabel) systemNarrativeLabel.textContent = content.label;
    if (systemNarrativeTitle) systemNarrativeTitle.textContent = content.title;
    if (systemNarrativeText) systemNarrativeText.textContent = content.text;
  };
  systemNodes.forEach((node) => {
    node.addEventListener('pointerenter', () => selectSystem(node.dataset.systemNode));
    node.addEventListener('focus', () => selectSystem(node.dataset.systemNode));
    node.addEventListener('click', () => selectSystem(node.dataset.systemNode));
  });

  const developedCopy = {
    status: { title: 'Status before metrics', text: 'Explain what is happening before presenting values.' },
    home: { title: 'Home demand as the anchor', text: 'Organise devices around what the household consumes.' },
    connections: { title: 'Active connections only', text: 'Avoid visual relationships that contradict real energy movement.' },
    depth: { title: 'Progressive technical depth', text: 'Keep detail accessible without dominating the default view.' }
  };
  const developedButtons = [...document.querySelectorAll('[data-developed-decision]')];
  const developedHotspots = [...document.querySelectorAll('[data-developed-hotspot]')];
  const developedFrame = document.querySelector('.lab-developed-image-frame');
  const developedTitle = document.getElementById('developedCaptionTitle');
  const developedText = document.getElementById('developedCaptionText');

  const selectDevelopedDecision = (key) => {
    const content = developedCopy[key];
    if (!content || !developedFrame) return;
    developedFrame.dataset.activeDecision = key;
    developedButtons.forEach((button) => {
      const active = button.dataset.developedDecision === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    developedHotspots.forEach((hotspot) => hotspot.classList.toggle('is-active', hotspot.dataset.developedHotspot === key));
    if (developedTitle) developedTitle.textContent = content.title;
    if (developedText) developedText.textContent = content.text;
  };
  developedButtons.forEach((button) => button.addEventListener('click', () => selectDevelopedDecision(button.dataset.developedDecision)));

})();
