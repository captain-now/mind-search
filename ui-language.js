/* Shared language preference for the public Mind Search pages. */
window.mindSearchLanguage = (() => {
  const key = 'mindsearch-ui-language';
  const locales = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', fr: 'fr-FR' };
  const labels = { ko: '언어 선택', en: 'Language', zh: '选择语言', ja: '言語を選択', fr: 'Langue' };
  function read() {
    try {
      const code = localStorage.getItem(key);
      if (Object.hasOwn(locales, code)) return code;
    } catch {}
    const browser = (navigator.languages && navigator.languages[0]) || navigator.language || 'ko';
    const code = browser.toLowerCase();
    if (code.startsWith('zh')) return 'zh';
    for (const lang of ['ko', 'en', 'ja', 'fr']) if (code.startsWith(lang)) return lang;
    return 'en';
  }
  function sourceText(translate) {
    const sources = new WeakMap();
    return (node, field, current) => {
      let fields = sources.get(node);
      if (!fields) sources.set(node, fields = new Map());
      const previous = fields.get(field);
      const original = previous?.translated === current ? previous.original : current;
      const translated = translate(original);
      fields.set(field, { original, translated });
      return translated;
    };
  }
  return { key, locales, labels, read, sourceText };
})();
