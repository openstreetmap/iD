(function(context) {

var ohauth = {};

ohauth.qsString = function(obj) {
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
    }).join('&');
};

ohauth.sha = sha1();

ohauth.stringQs = function(str) {
    return str.split('&').reduce(function(obj, pair){
        var parts = pair.split('=');
        obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
        return obj;
    }, {});
};

ohauth.xhr = function(method, url, auth, data, options, callback) {
    var xhr = new XMLHttpRequest(),
        twoHundred = /^20\d$/;
    xhr.onreadystatechange = function() {
        if (4 == xhr.readyState && 0 !== xhr.status) {
            if (twoHundred.test(xhr.status)) {
                callback(null, xhr);
            } else {
                callback(xhr, null);
            }
        }
    };
    var headers = (options && options.header) || { 'Content-Type': 'application/x-www-form-urlencoded' };
    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', 'OAuth ' + ohauth.authHeader(auth));
    for (var h in headers) xhr.setRequestHeader(h, headers[h]);
    xhr.send(data);
};

ohauth.nonce = function() {
    for (var o = ''; o.length < 6;) {
        o += '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'[Math.floor(Math.random() * 61)];
    }
    return o;
};

ohauth.authHeader = function(obj) {
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '="' + encodeURIComponent(obj[key]) + '"';
    }).join(', ');
};

ohauth.timestamp = function() { return ~~((+new Date()) / 1000); };

ohauth.percentEncode = function(s) {
    return encodeURIComponent(s)
    .replace(/\!/g, '%21').replace(/\'/g, '%27')
    .replace(/\*/g, '%2A').replace(/\(/g, '%28').replace(/\)/g, '%29');
};

ohauth.baseString = function(method, url, params) {
    if (params.oauth_signature) delete params.oauth_signature;
    return [
        method,
        ohauth.percentEncode(url),
        ohauth.percentEncode(ohauth.qsString(params))].join('&');
};

ohauth.signature = function(oauth_secret, token_secret, baseString) {
    return ohauth.sha.b64_hmac_sha1(
        ohauth.percentEncode(oauth_secret) + '&' +
        ohauth.percentEncode(token_secret),
        baseString);
};

context.ohauth = ohauth;

})(this);

