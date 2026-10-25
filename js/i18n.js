/* Tiny translation engine.
   Elements opt in with:
     data-i18n="key"                       -> sets the text
     data-i18n-attr="attr:key;attr2:key2"  -> sets attributes (placeholder, aria-label, alt, title...)
   Texts live in js/lang/<code>.js. To add a language: create the file, load it in the pages
   and add its code to SUPPORTED below. */
(function () {
  var SUPPORTED = ['en', 'es'];
  var STORE_KEY = 'lang';

  function detect() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (SUPPORTED.indexOf(saved) > -1) return saved;
    } catch (e) {}
    var pref = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return /^es(\b|-|_)/i.test(pref) ? 'es' : 'en';
  }

  var current = detect();

  function t(key, vars) {
    var dict = (window.I18N && window.I18N[current]) || {};
    var text = dict[key];
    if (text == null) text = ((window.I18N && window.I18N.en) || {})[key];
    if (text == null) return key;
    if (vars) text = text.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return text;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i > 0) el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
      });
    });
    document.documentElement.lang = current;
    var titleKey = document.body && document.body.getAttribute('data-title');
    if (titleKey) document.title = t(titleKey);
  }

  function set(lang) {
    if (SUPPORTED.indexOf(lang) < 0) return;
    current = lang;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang } }));
  }

  function toggle() { set(SUPPORTED[(SUPPORTED.indexOf(current) + 1) % SUPPORTED.length]); }

  window.i18n = { t: t, apply: apply, set: set, toggle: toggle, get: function () { return current; } };
})();
