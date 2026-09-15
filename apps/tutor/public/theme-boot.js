(function () {
  try {
    var stored = localStorage.getItem('ai-tutor-settings');
    var parsed = stored ? JSON.parse(stored) : null;
    var theme = parsed && parsed.state && parsed.state.settings ? parsed.state.settings.theme : null;
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark);
    var root = document.documentElement;
    if (shouldUseDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch (_) {
    /* no-op */
  }
})();
