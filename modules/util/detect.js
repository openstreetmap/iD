import { currentLocale, setTextDirection, setLanguageNames, setScriptNames } from './locale';
import { dataLocales } from '../../data/index';
import { utilStringQs } from './util';

let _detected;

export function utilDetect(force) {
  if (_detected && !force) return _detected;
  _detected = {};

  const ua = navigator.userAgent;
  const hash = utilStringQs(window.location.hash);
  let m = null;

  /* Browser */
  m = ua.match(/(edge)\/?\s*(\.?\d+(\.\d+)*)/i);   // Edge
  if (m !== null) {
    _detected.browser = m[1];
    _detected.version = m[2];
  }
  if (!_detected.browser) {
    m = ua.match(/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/i);   // IE11
    if (m !== null) {
      _detected.browser = 'msie';
      _detected.version = m[1];
    }
  }
  if (!_detected.browser) {
    m = ua.match(/(opr)\/?\s*(\.?\d+(\.\d+)*)/i);   // Opera 15+
    if (m !== null) {
      _detected.browser = 'Opera';
      _detected.version = m[2];
    }
  }
  if (!_detected.browser) {
    m = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if (m !== null) {
      _detected.browser = m[1];
      _detected.version = m[2];
      m = ua.match(/version\/([\.\d]+)/i);
      if (m !== null) _detected.version = m[1];
    }
  }
  if (!_detected.browser) {
    _detected.browser = navigator.appName;
    _detected.version = navigator.appVersion;
  }

  // keep major.minor version only..
  _detected.version = _detected.version.split(/\W/).slice(0,2).join('.');

  // detect other browser capabilities
  // Legacy Opera has incomplete svg style support. See #715
  _detected.opera = (_detected.browser.toLowerCase() === 'opera' && parseFloat(_detected.version) < 15 );

  if (_detected.browser.toLowerCase() === 'msie') {
    _detected.ie = true;
    _detected.browser = 'Internet Explorer';
    _detected.support = parseFloat(_detected.version) >= 11;
  } else {
    _detected.ie = false;
    _detected.support = true;
  }

  _detected.filedrop = (window.FileReader && 'ondrop' in window);
  _detected.download = !(_detected.ie || _detected.browser.toLowerCase() === 'edge');
  _detected.cssfilters = !(_detected.ie || _detected.browser.toLowerCase() === 'edge');


  /* Platform */
  if (/Win/.test(ua)) {
    _detected.os = 'win';
    _detected.platform = 'Windows';
  } else if (/Mac/.test(ua)) {
    _detected.os = 'mac';
    _detected.platform = 'Macintosh';
  } else if (/X11/.test(ua) || /Linux/.test(ua)) {
    _detected.os = 'linux';
    _detected.platform = 'Linux';
  } else {
    _detected.os = 'win';
    _detected.platform = 'Unknown';
  }


  /* Locale, Language */
  // The locale and language specified in the url hash
  if (hash.locale) {
    _detected.hashLocale = hash.locale;
    _detected.hashLanguage = hash.locale.split('-')[0];
  }

  // The locale and language specified by the user's browser
  _detected.browserLocale = (navigator.language || navigator.userLanguage || 'en-US');
  _detected.browserLanguage = _detected.browserLocale.split('-')[0];

  // Search `navigator.languages` for a better locale.  Prefer the first language,
  //   unless the second language is a culture-specific version of the first one, see #3842
  if (navigator.languages && navigator.languages.length > 0) {
    const code0 = navigator.languages[0];
    const parts0 = code0.split('-');

    _detected.browserLocale = code0;
    _detected.browserLanguage = parts0[0];

    if (navigator.languages.length > 1 && parts0.length === 1) {
      const code1 = navigator.languages[1];
      const parts1 = code1.split('-');

      if (parts1[0] === parts0[0]) {
        _detected.browserLocale = code1;
      }
    }
  }

  // The locale and language actually being used by iD.
  // This can be changed at any time and is stored in the `currentLocale` export.
  // So report those instead (except in the situation where 'en' might override 'en-US')
  const current = currentLocale || 'en';
  if (current === 'en') {
    _detected.locale = _detected.hashLocale || _detected.browserLocale;
    _detected.language = _detected.hashLanguage || _detected.browserLanguage;
  } else {
    _detected.locale = current;
    _detected.language = current.split('-')[0];
  }

  // detect text direction
  const lang = dataLocales[_detected.locale] || dataLocales[_detected.language];
  if ((lang && lang.rtl) || (hash.rtl === 'true')) {
    _detected.textDirection = 'rtl';
  } else {
    _detected.textDirection = 'ltr';
  }
  setTextDirection(_detected.textDirection);
  setLanguageNames((lang && lang.languageNames) || {});
  setScriptNames((lang && lang.scriptNames) || {});

  /* Host */
  const loc = window.top.location;
  let origin = loc.origin;
  if (!origin) {  // for unpatched IE11
    origin = loc.protocol + '//' + loc.hostname + (loc.port ? ':' + loc.port: '');
  }

  _detected.host = origin + loc.pathname;


  return _detected;
}
