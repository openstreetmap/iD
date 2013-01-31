var locale = { current: 'en' };

function t(s, o) {
    var path = s.split(".").reverse(),
        rep = locale[locale.current];

    while (rep !== undefined && path.length) rep = rep[path.pop()];

    if (rep !== undefined) {
        if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
        return rep;
    } else {
        if (console) console.error('key ' + s + ' not found');
    }
}
