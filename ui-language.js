/* Shared language preference for the public Mind Search pages. */
window.mindSearchLanguage = (() => {
  const key = 'mindsearch-ui-language';
  const locales = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
  const labels = { ko: '언어 선택', en: 'Language', zh: '选择语言', ja: '言語を選択' };
  function read() {
    try {
      const code = localStorage.getItem(key);
      if (Object.hasOwn(locales, code)) return code;
    } catch {}
    return 'ko';
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
