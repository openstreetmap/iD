iD.util = {};

iD.util.trueObj = function(arr) {
    var o = {};
    for (var i = 0, l = arr.length; i < l; i++) o[arr[i]] = true;
    return o;
};

iD.util.codeWindow = function(content) {
    top.win = window.open('','contentWindow',
        'width=350,height=350,menubar=0' +
        ',toolbar=1,status=0,scrollbars=1,resizable=1');
    top.win.document.writeln('<pre>' + content + '</pre>');
    top.win.document.close();
};

iD.util.tagText = function(entity) {
    return d3.entries(entity.tags).map(function(e) {
        return e.key + ': ' + e.value;
    }).join('\n');
};

iD.util.stringQs = function(str) {
    return str.split('&').reduce(function(obj, pair){
        var parts = pair.split('=');
        if (parts.length === 2) {
            obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
        }
        return obj;
    }, {});
};

iD.util.qsString = function(obj, noencode) {
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + (
            noencode ? obj[key] : encodeURIComponent(obj[key]));
    }).join('&');
};

iD.util.prefixDOMProperty = function(property) {
    var prefixes = ['webkit', 'ms', 'moz', 'o'],
        i = -1,
        n = prefixes.length,
        s = document.body;

    if (property in s)
        return property;

    property = property.substr(0, 1).toUpperCase() + property.substr(1);

    while (++i < n)
        if (prefixes[i] + property in s)
            return prefixes[i] + property;

    return false;
};

iD.util.prefixCSSProperty = function(property) {
    var prefixes = ['webkit', 'ms', 'Moz', 'O'],
        i = -1,
        n = prefixes.length,
        s = document.body.style;

    if (property.toLowerCase() in s)
        return property.toLowerCase();

    while (++i < n)
        if (prefixes[i] + property in s)
            return '-' + prefixes[i].toLowerCase() + '-' + property.toLowerCase();

    return false;
};
