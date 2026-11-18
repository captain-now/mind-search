/* Shared language preference for the public Mind Search pages. */
window.mindSearchLanguage = (() => {
  const key = 'mindsearch-ui-language';
  const locales = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', fr: 'fr-FR', hi: 'hi-IN', ru: 'ru-RU', de: 'de-DE' };
  const labels = { ko: '언어 선택', en: 'Language', zh: '选择语言', ja: '言語を選択', fr: 'Langue', hi: 'भाषा', ru: 'Язык', de: 'Sprache' };
  function read() { return 'ko'; }
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
  const options = [['ko','🇰🇷 한국어'],['en','🇺🇸 English'],['zh','🇨🇳 中文'],['ja','🇯🇵 日本語'],['fr','🇫🇷 Français'],['hi','🇮🇳 हिन्दी'],['ru','🇷🇺 Русский'],['de','🇩🇪 Deutsch']];
  function write(code) { return code === 'ko'; }
  function syncAcrossTabs() {
    window.addEventListener('storage', event => {
      if (event.key === key && event.newValue && Object.hasOwn(locales, event.newValue) && document.documentElement.lang !== event.newValue) location.reload();
    });
  }
  // Korean-only mode: ignore saved foreign-language preferences.

  return { key, locales, labels, options, read, write, sourceText };
})();
