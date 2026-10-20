/**
 * ALEXA NICHOLE REOYO — SOFTWARE ENGINEERING PORTFOLIO
 * Interactive Slide / Scroll Deck, Video Tour Auto-Player, Photo Uploader & Clipboard
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const pages = Array.from(document.querySelectorAll('.portfolio-page'));
  const navPills = Array.from(document.querySelectorAll('.nav-pill'));
  const gotoLinks = Array.from(document.querySelectorAll('[data-goto]'));
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');
  const deckIndicator = document.getElementById('deckIndicator');
  const viewModeBtn = document.getElementById('viewModeBtn');
  const viewModeLabel = document.getElementById('viewModeLabel');
  const autoplayBtn = document.getElementById('autoplayBtn');
  const autoplayIcon = document.getElementById('autoplayIcon');
  const autoplayLabel = document.getElementById('autoplayLabel');
  const tourProgressTrack = document.getElementById('tourProgressTrack');
  const tourProgressBar = document.getElementById('tourProgressBar');
  const toastEl = document.getElementById('girlyToast');

  let currentIndex = 0;
  let isSlideMode = false;
  let isAutoplaying = false;
  let autoplayTimer = null;
  let progressInterval = null;
  const SLIDE_DURATION_MS = 4500;

  // Format page number helper
  const formatPageIndicator = (idx) => {
    const pageNum = String(idx + 1).padStart(2, '0');
    const total = String(pages.length).padStart(2, '0');
    return `PAGE ${pageNum} / ${total}`;
  };

  // Update active UI states for current page index
  function updateActivePageUI(index) {
    currentIndex = Math.max(0, Math.min(pages.length - 1, index));

    pages.forEach((section, idx) => {
      section.classList.toggle('active-slide', idx === currentIndex);
    });

    navPills.forEach((pill, idx) => {
      pill.classList.toggle('active', idx === currentIndex);
    });

    if (deckIndicator) {
      deckIndicator.textContent = formatPageIndicator(currentIndex);
    }
  }

  // Navigate to specific page index
  function goToPage(index, smoothScroll = true) {
    const targetIdx = (index + pages.length) % pages.length;
    updateActivePageUI(targetIdx);

    if (isSlideMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (smoothScroll && pages[targetIdx]) {
      pages[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Toggle between Scroll View and Slide Deck View
  function setViewMode(slideMode) {
    isSlideMode = slideMode;
    body.setAttribute('data-mode', isSlideMode ? 'slide' : 'scroll');
    if (viewModeLabel) {
      viewModeLabel.textContent = isSlideMode ? 'Scroll Mode' : 'Slide Mode';
    }
    updateActivePageUI(currentIndex);
    if (!isSlideMode && pages[currentIndex]) {
      pages[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (viewModeBtn) {
    viewModeBtn.addEventListener('click', () => {
      stopAutoplay();
      setViewMode(!isSlideMode);
    });
  }

  // Autoplay Video Tour Mode
  function startAutoplay() {
    if (!isSlideMode) {
      setViewMode(true);
    }
    isAutoplaying = true;
    autoplayBtn.classList.add('playing');
    autoplayIcon.textContent = '⏸';
    autoplayLabel.textContent = 'Pause Tour';
    tourProgressTrack.classList.add('visible');

    let elapsed = 0;
    const stepMs = 50;
    tourProgressBar.style.width = '0%';

    clearInterval(progressInterval);
    clearTimeout(autoplayTimer);

    const runSlideCycle = () => {
      elapsed = 0;
      tourProgressBar.style.width = '0%';

      progressInterval = setInterval(() => {
        elapsed += stepMs;
        const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
        tourProgressBar.style.width = `${pct}%`;

        if (elapsed >= SLIDE_DURATION_MS) {
          clearInterval(progressInterval);
          const nextIdx = (currentIndex + 1) % pages.length;
          goToPage(nextIdx, false);
          runSlideCycle();
        }
      }, stepMs);
    };

    runSlideCycle();
  }

  function stopAutoplay() {
    if (!isAutoplaying) return;
    isAutoplaying = false;
    clearInterval(progressInterval);
    clearTimeout(autoplayTimer);
    autoplayBtn.classList.remove('playing');
    autoplayIcon.textContent = '▶';
    autoplayLabel.textContent = 'Play Video Tour';
    tourProgressTrack.classList.remove('visible');
    tourProgressBar.style.width = '0%';
  }

  if (autoplayBtn) {
    autoplayBtn.addEventListener('click', () => {
      if (isAutoplaying) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });
  }

  // Navigation Links & Buttons
  gotoLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetIndex = parseInt(link.getAttribute('data-goto'), 10);
      if (!Number.isNaN(targetIndex)) {
        e.preventDefault();
        stopAutoplay();
        goToPage(targetIndex, true);
      }
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopAutoplay();
      goToPage(currentIndex - 1, true);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopAutoplay();
      goToPage(currentIndex + 1, true);
    });
  }

  // Keyboard Left / Right Navigation
  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight') {
      stopAutoplay();
      goToPage(currentIndex + 1, true);
    } else if (e.key === 'ArrowLeft') {
      stopAutoplay();
      goToPage(currentIndex - 1, true);
    }
  });

  // Scroll Spy for Scroll Mode
  const observer = new IntersectionObserver(
    (entries) => {
      if (isSlideMode) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = pages.indexOf(entry.target);
          if (idx !== -1) {
            updateActivePageUI(idx);
          }
        }
      });
    },
    { threshold: 0.42 }
  );

  pages.forEach((page) => observer.observe(page));

  // =========================================================================
  // PROFILE PHOTO INITIALIZATION (Page 2: About Me)
  // =========================================================================
  // Clear any legacy test upload from localStorage so profile.jpg is always loaded
  try {
    localStorage.removeItem('alexa_portfolio_custom_photo_v1');
  } catch (_) {}

  // =========================================================================
  // COPY TO CLIPBOARD & TOAST (Page 6: Contact)
  // =========================================================================
  let toastTimeout = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.hidden = true;
    }, 2400);
  }

  const copyButtons = document.querySelectorAll('[data-copy]');
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const value = btn.getAttribute('data-copy');
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const originalText = btn.textContent;
        btn.textContent = 'Copied ✓';
        showToast(`✦ Copied: ${value} ✦`);
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1800);
      } catch (_) {
        showToast('✦ Select & copy text directly ✦');
      }
    });
  });

  // Make entire contact cards clickable to redirect to their corresponding link
  const clickableCards = document.querySelectorAll('.clickable-card[data-href]');
  clickableCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.copy-chip') || e.target.closest('a')) return;
      const href = card.getAttribute('data-href');
      const target = card.getAttribute('data-target');
      if (!href) return;
      if (target === '_blank') {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.copy-chip')) return;
        e.preventDefault();
        const href = card.getAttribute('data-href');
        const target = card.getAttribute('data-target');
        if (!href) return;
        if (target === '_blank') {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = href;
        }
      }
    });
  });
});
