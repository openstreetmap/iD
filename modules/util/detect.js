import { currentLocale, setTextDirection } from './locale';
import { utilStringQs } from './index';

var detected;

export function utilDetect(force) {
    if (detected && !force) return detected;
    detected = {};

    var ua = navigator.userAgent,
        m = null;

    m = ua.match(/(edge)\/?\s*(\.?\d+(\.\d+)*)/i);   // Edge
    if (m !== null) {
        detected.browser = m[1];
        detected.version = m[2];
    }
    if (!detected.browser) {
        m = ua.match(/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/i);   // IE11
        if (m !== null) {
            detected.browser = 'msie';
            detected.version = m[1];
        }
    }
    if (!detected.browser) {
        m = ua.match(/(opr)\/?\s*(\.?\d+(\.\d+)*)/i);   // Opera 15+
        if (m !== null) {
            detected.browser = 'Opera';
            detected.version = m[2];
        }
    }
    if (!detected.browser) {
        m = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (m !== null) {
            detected.browser = m[1];
            detected.version = m[2];
            m = ua.match(/version\/([\.\d]+)/i);
            if (m !== null) detected.version = m[1];
        }
    }
    if (!detected.browser) {
        detected.browser = navigator.appName;
        detected.version = navigator.appVersion;
    }

    // keep major.minor version only..
    detected.version = detected.version.split(/\W/).slice(0,2).join('.');

    if (detected.browser.toLowerCase() === 'msie') {
        detected.ie = true;
        detected.browser = 'Internet Explorer';
        detected.support = parseFloat(detected.version) >= 11;
    } else {
        detected.ie = false;
        detected.support = true;
    }

    // Added due to incomplete svg style support. See #715
    detected.opera = (detected.browser.toLowerCase() === 'opera' && parseFloat(detected.version) < 15 );

    detected.locale = (navigator.languages && navigator.languages.length)
        ? navigator.languages[0] : (navigator.language || navigator.userLanguage || 'en-US');

    // Loaded locale is stored in currentLocale
    // return that instead (except in the situation where 'en' might override 'en-US')
    var loadedLocale = currentLocale || 'en';
    if (loadedLocale !== 'en') {
        detected.locale = loadedLocale;
    }

    // detect text direction
    var q = utilStringQs(window.location.hash.substring(1));
    if (['ar', 'fa', 'iw', 'dv'].indexOf(detected.locale.split('-')[0]) > -1 || q.hasOwnProperty('rtl')) {
        detected.textDirection = 'rtl';
    } else {
        detected.textDirection = 'ltr';
    }
    setTextDirection(detected.textDirection);

    detected.host = window.location && (window.location.origin + window.location.pathname);

    detected.filedrop = (window.FileReader && 'ondrop' in window);

    function nav(x) {
        return navigator.userAgent.indexOf(x) !== -1;
    }

    if (nav('Win')) {
        detected.os = 'win';
        detected.platform = 'Windows';
    }
    else if (nav('Mac')) {
        detected.os = 'mac';
        detected.platform = 'Macintosh';
    }
    else if (nav('X11') || nav('Linux')) {
        detected.os = 'linux';
        detected.platform = 'Linux';
    }
    else {
        detected.os = 'win';
        detected.platform = 'Unknown';
    }

    return detected;
}
