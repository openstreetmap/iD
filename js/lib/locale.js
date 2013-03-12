window.locale = { _current: 'en' };

locale.current = function(_) {
    if (!arguments.length) return locale._current;
    if (locale[_] !== undefined) locale._current = _;
    else if (locale[_.split('-')[0]]) locale._current = _.split('-')[0];
    return locale;
};

function t(s, o, loc) {
    loc = loc || locale._current;

    var path = s.split(".").reverse(),
        rep = locale[loc];

    while (rep !== undefined && path.length) rep = rep[path.pop()];

    if (rep !== undefined) {
        if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
        return rep;
    } else if (o.default) {
        return o.default;
    } else {
        var missing = 'Missing translation: ' + s;
        if (console) console.error(missing);
        if (loc !== 'en') return t(s, o, 'en');
        return missing;
    }
}
