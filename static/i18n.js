'use strict';

// ── Translation dictionaries ────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    page_title:           'AC:NH Catalog Scanner',
    header_subtitle:      'Upload a video or screenshot from Animal Crossing: New Horizons to scan your items.',
    card_upload_title:    '\uD83C\uDF92 Upload & Scan',
    label_file:           'Video or Screenshot',
    dropzone_title:       'Drop your file here',
    dropzone_sub:         'or click to browse \u2022 MP4, MOV, AVI, MKV, PNG, JPG \u2022 max 500\u00a0MB',
    label_mode:           '\uD83D\uDCCB Scan Mode',
    label_locale:         '\uD83C\uDF10 Language',
    checkbox_forsale:     '\uD83C\uDFF7\uFE0F For-sale items only',
    checkbox_forsale_sub: 'Catalog mode: skip items not available for purchase',
    btn_scan:             '\uD83D\uDD0D Start Scanning!',
    progress_text:        'Tom Nook is processing your catalog',
    card_results_title:   '\uD83C\uDF1F Scan Results',
    meta_mode_label:      'Mode:',
    meta_locale_label:    'Locale:',
    search_placeholder:   '\uD83D\uDD0E Filter items\u2026',
    btn_copy:             '\uD83D\uDCCB Copy',
    btn_copy_done:        '\u2705 Copied!',
    btn_export:           '\u2B07 Export .txt',
    table_num:            '#',
    table_item:           'Item Name',
    footer_text:          '\uD83C\uDF43 CatalogScanner \u2022 Animal Crossing: New Horizons',
    no_items:             'No items found \uD83C\uDF3F',
    result_count:         n => n + ' item' + (n !== 1 ? 's' : ''),
    unmatched_summary:    n => `\u26A0\uFE0F ${n} unrecognised OCR string${n !== 1 ? 's' : ''}`,
    error_unknown:        'Unknown error',
    error_network:        'Network error: ',
    file_prefix:          '\uD83D\uDCCE ',
  },
  pl: {
    page_title:           'AC:NH Catalog Scanner',
    header_subtitle:      'Prześlij nagranie lub zrzut ekranu z Animal Crossing: New Horizons, aby zeskanować swoje przedmioty.',
    card_upload_title:    '\uD83C\uDF92 Prześlij i Skanuj',
    label_file:           'Nagranie lub zrzut ekranu',
    dropzone_title:       'Upuść plik tutaj',
    dropzone_sub:         'lub kliknij, aby wybrać \u2022 MP4, MOV, AVI, MKV, PNG, JPG \u2022 maks. 500\u00a0MB',
    label_mode:           '\uD83D\uDCCB Tryb skanowania',
    label_locale:         '\uD83C\uDF10 Język gry',
    checkbox_forsale:     '\uD83C\uDFF7\uFE0F Tylko przedmioty na sprzedaż',
    checkbox_forsale_sub: 'Tryb katalogu: pomija przedmioty niedostępne w sklepie',
    btn_scan:             '\uD83D\uDD0D Rozpocznij skanowanie!',
    progress_text:        'Tom Nook przetwarza twój katalog',
    card_results_title:   '\uD83C\uDF1F Wyniki skanowania',
    meta_mode_label:      'Tryb:',
    meta_locale_label:    'Język:',
    search_placeholder:   '\uD83D\uDD0E Filtruj przedmioty\u2026',
    btn_copy:             '\uD83D\uDCCB Skopiuj',
    btn_copy_done:        '\u2705 Skopiowano!',
    btn_export:           '\u2B07 Eksportuj .txt',
    table_num:            '#',
    table_item:           'Nazwa przedmiotu',
    footer_text:          '\uD83C\uDF43 CatalogScanner \u2022 Animal Crossing: New Horizons',
    no_items:             'Nie znaleziono przedmiotów \uD83C\uDF3F',
    result_count: n => {
      if (n === 1) return '1 przedmiot';
      const mod10 = n % 10, mod100 = n % 100;
      if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return n + ' przedmioty';
      return n + ' przedmiotów';
    },
    unmatched_summary: n => {
      const mod10 = n % 10, mod100 = n % 100;
      const form = (n === 1)
        ? 'nierozpoznany ciąg OCR'
        : (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14))
          ? 'nierozpoznane ciągi OCR'
          : 'nierozpoznanych ciągów OCR';
      return `\u26A0\uFE0F ${n} ${form}`;
    },
    error_unknown:        'Nieznany błąd',
    error_network:        'Błąd sieci: ',
    file_prefix:          '\uD83D\uDCCE ',
  },
};

// ── State ───────────────────────────────────────────────────────────────────
const SUPPORTED_LANGS = ['en', 'pl'];
const DEFAULT_LANG    = 'en';

let _currentLang = localStorage.getItem('ui-lang') || DEFAULT_LANG;
if (!SUPPORTED_LANGS.includes(_currentLang)) _currentLang = DEFAULT_LANG;

// ── Public API ───────────────────────────────────────────────────────────────

/** Return the translated string for the given key in the active language. */
function t(key, ...args) {
  const dict = TRANSLATIONS[_currentLang] || TRANSLATIONS[DEFAULT_LANG];
  const val  = Object.prototype.hasOwnProperty.call(dict, key)
    ? dict[key]
    : TRANSLATIONS[DEFAULT_LANG][key];
  if (typeof val === 'function') return val(...args);
  return val ?? key;
}

function getCurrentLang() {
  return _currentLang;
}

/**
 * Switch the active UI language, persist the choice, apply translations
 * and dispatch a `langchange` event so other modules can re-render
 * dynamic content.
 */
function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  _currentLang = lang;
  localStorage.setItem('ui-lang', lang);
  applyTranslations();
  _updateSwitcher();
  document.dispatchEvent(new CustomEvent('langchange'));
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function applyTranslations() {
  document.documentElement.lang = _currentLang;
  document.title = t('page_title');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

function _updateSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('lang-btn--active', btn.dataset.lang === _currentLang);
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  _updateSwitcher();

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
});
