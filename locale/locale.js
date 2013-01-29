var locale = { current: 'en' };

function t(s, o) {
    if (locale[locale.current][s] !== undefined) {
        var rep = locale[locale.current][s];
        if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
        return rep;
    } else {
        if (console) console.error('key ' + s + ' not found');
    }
}
