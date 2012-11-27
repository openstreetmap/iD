iD.OAuth = function() {
    var baseurl = 'http://api06.dev.openstreetmap.org',
        apibase = 'http://api06.dev.openstreetmap.org',
        oauth_secret = 'aMnOOCwExO2XYtRVWJ1bI9QOdqh1cay2UgpbhA6p',
        oauth = {};

    var o = {
        oauth_consumer_key: 'zwQZFivccHkLs3a8Rq5CoS412fE5aPCXDw9DZj7R',
        oauth_signature_method: 'HMAC-SHA1'
    };

    function keyclean(x) { return x.replace(/\W/g, ''); }

    if (localStorage.oauth_token) {
        o.oauth_token = localStorage.oauth_token;
    }

    function timenonce(o) {
        o.oauth_timestamp = ohauth.timestamp();
        o.oauth_nonce = ohauth.nonce();
        return o;
    }

    // token getter/setter, namespaced to the current `apibase` value.
    function token(k, x) {
        if (arguments.length == 2) {
            localStorage[keyclean(apibase) + k] = x;
        }
        return localStorage[keyclean(apibase) + k];
    }

    oauth.authenticated = function() {
        return token('oauth_token') && token('oauth_token_secret');
    };

    oauth.logout = function() {
        token('oauth_token', '');
        token('oauth_token_secret', '');
        return oauth;
    };

    oauth.xhr = function(options, callback) {
        if (token('oauth_token')) {
            o.oauth_token = token('oauth_token');
        }
        o = timenonce(o);
        var url = apibase + options.path;
        var oauth_token_secret = token('oauth_token_secret');
        o.oauth_signature = ohauth.signature(oauth_secret, oauth_token_secret,
            ohauth.baseString(options.method, url, o));
        ohauth.xhr(options.method, url, o, options.content, options.options, function(xhr) {
            if (xhr.responseXML) callback(xhr.responseXML);
            else callback(xhr.response);
        });
    };

    oauth.authenticate = function(callback) {
        // TODO: deal with changing the api endpoint
        if (oauth.authenticated()) return callback();

        var shaded = d3.select(document.body)
            .append('div')
            .attr('class', 'shaded')
            .on('click', function() {
                if (d3.event.target == this) shaded.remove();
            });
        var modal = shaded.append('div').attr('class', 'modal');
        var ifr = modal.append('iframe')
            .attr({ width: 640, height: 550, frameborder: 'no' });

        o = timenonce(o);
        var url = baseurl + '/oauth/request_token';
        o.oauth_signature = ohauth.signature(oauth_secret, '',
            ohauth.baseString('POST', url, o));

        ohauth.xhr('POST', url, o, null, {}, function(xhr) {
            var resp = ohauth.stringQs(xhr.response);
            token('oauth_request_token_secret', resp.oauth_token_secret);
            var at = baseurl + '/oauth/authorize?';
            ifr.attr('src', at + ohauth.qsString({
                oauth_token: resp.oauth_token, oauth_callback: location.href
            }));
        });
        ifr.on('load', function() {
            if (ifr.node().contentWindow.location.search) {
                var search = ifr.node().contentWindow.location.search,
                    oauth_token = ohauth.stringQs(search.slice(1)),
                    url = baseurl + '/oauth/access_token';
                o = timenonce(o);
                shaded.remove();

                o.oauth_token = oauth_token.oauth_token;
                var request_token_secret = token('oauth_request_token_secret');
                o.oauth_signature = ohauth.signature(oauth_secret, request_token_secret,
                    ohauth.baseString('POST', url, o));
                ohauth.xhr('POST', url, o, null, {}, function(xhr) {
                    var access_token = ohauth.stringQs(xhr.response);
                    token('oauth_token', access_token.oauth_token);
                    token('oauth_token_secret', access_token.oauth_token_secret);
                    callback();
                });
            }
        });
    };

    oauth.setAPI = function(x) {
        apibase = x;
        return oauth;
    };

    return oauth;
};
