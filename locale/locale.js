var locale = { _current: 'en' };

locale.current = function(_) {
    if (!arguments.length) return locale._current;
    if (locale[_] !== undefined) locale._current = _;
    return locale;
};

function t(s, o) {
    var path = s.split(".").reverse(),
        rep = locale[locale._current];

    while (rep !== undefined && path.length) rep = rep[path.pop()];

    if (rep !== undefined) {
        if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
        return rep;
    } else {
        if (console) console.error('key ' + s + ' not found');
    }
}
