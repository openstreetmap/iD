window.locale = { _current: 'en' };

// set the current locale
// return the current locale of no arguments applied
// set the current locale to _ if locale[_] exists
// set the current locale to first substr before '-' in _(_sub) if locale[_sub] exists
// if all above fails, just return the whole locale
locale.current = function(_) {
    if (!arguments.length) return locale._current;
    if (locale[_] !== undefined) locale._current = _;
    else if (locale[_.split('-')[0]]) locale._current = _.split('-')[0];
    return locale;
};

// get the locale value
// step 1: return the locale value of s in loc if exists, replace the {key} with the correlative value in o
// step 2: set the loc to 'en', retry step 1
// step 3: return the value of 'default' in o
// step 4: return an error message
function t(s, o, loc) {
    loc = loc || locale._current;

    var path = s.split(".").reverse(),
        rep = locale[loc];

    while (rep !== undefined && path.length) rep = rep[path.pop()];

    if (rep !== undefined) {
        if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
        return rep;
    }

    if (loc !== 'en') {
        return t(s, o, 'en');
    }

    if (o && 'default' in o) {
        return o['default'];
    }

    var missing = 'Missing ' + loc + ' translation: ' + s;
    if (typeof console !== "undefined") console.error(missing);

    return missing;
}
