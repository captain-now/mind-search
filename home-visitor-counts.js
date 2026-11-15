(() => {
  const counter = document.getElementById('homeVisitorCounts');
  const labels = {
    ko: ['오늘 방문자', '누적 방문자'],
    en: ['Today', 'All-time visitors'],
    zh: ['今日访客', '累计访客'],
    ja: ['今日の訪問者', '累計訪問者']
  };
  const values = counter.querySelectorAll('[data-count]');
  let counts;

  function render() {
    const lang = document.documentElement.lang.split('-')[0];
    const words = labels[lang] || labels.ko;
    const format = new Intl.NumberFormat(labels[lang] ? lang : 'ko');
    values.forEach((value, index) => {
      value.previousElementSibling.textContent = words[index];
      value.textContent = counts ? format.format(counts[value.dataset.count]) : '—';
    });
  }

  function getBrowserId() {
    try {
      const storageKey = 'mind-search-home-visitor';
      const existing = localStorage.getItem(storageKey);
      if (existing && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(existing)) return existing;
      const id = crypto.randomUUID();
      localStorage.setItem(storageKey, id);
      return id;
    } catch {
      return null;
    }
  }

  async function loadCounts() {
    try {
      const browserId = navigator.locks
        ? await navigator.locks.request('mind-search-home-visitor', getBrowserId)
        : getBrowserId();
      const response = await fetch('https://iqohtsakhfnwtlbarjut.supabase.co/rest/v1/rpc/record_home_visit', {
        method: 'POST',
        headers: {
          apikey: 'sb_publishable_MZU5P4iF3BmY27FSee2ntw_mVO9Lf5w',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ browser_id: browserId })
      });
      if (!response.ok) return;
      const result = await response.json();
      if (!['today', 'total'].every(key => Number.isSafeInteger(result[key]) && result[key] >= 0)) return;
      counts = result;
      render();
    } catch {
      // Leave the values blank when the service cannot be reached.
    }
  }

  render();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  loadCounts();
})();
