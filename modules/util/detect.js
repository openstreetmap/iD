
let _detected;

export function utilDetect(refresh) {
  if (_detected && !refresh) return _detected;
  _detected = {};

  const ua = navigator.userAgent;
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

  _detected.isMobileWebKit = (/\b(iPad|iPhone|iPod)\b/.test(ua) ||
    // HACK: iPadOS 13+ requests desktop sites by default by using a Mac user agent,
    // so assume any "mac" with multitouch is actually iOS
    (navigator.platform === 'MacIntel' && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1)) &&
    /WebKit/.test(ua) &&
    !/Edge/.test(ua) &&
    !window.MSStream;


  /* Locale */
  // An array of locales requested by the browser in priority order.
  _detected.browserLocales = Array.from(new Set( // remove duplicates
      [navigator.language]
        .concat(navigator.languages || [])
        .concat([
            // old property for backwards compatibility
            navigator.userLanguage,
            // fallback to English
            'en'
        ])
        // remove any undefined values
        .filter(Boolean)
    ));


  /* Host */
  const loc = window.top.location;
  let origin = loc.origin;
  if (!origin) {  // for unpatched IE11
    origin = loc.protocol + '//' + loc.hostname + (loc.port ? ':' + loc.port: '');
  }

  _detected.host = origin + loc.pathname;


  return _detected;
}
