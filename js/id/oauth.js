iD.OAuth = function() {
    var baseurl = 'http://www.openstreetmap.org',
        oauth_secret = 'aMnOOCwExO2XYtRVWJ1bI9QOdqh1cay2UgpbhA6p',
        oauth = {};

    var o = {
        oauth_consumer_key: 'zwQZFivccHkLs3a8Rq5CoS412fE5aPCXDw9DZj7R',
        oauth_signature_method: 'HMAC-SHA1'
    };

    function keyclean(x) { return x.replace(/\W/g, ''); }

    if (token('oauth_token')) {
        o.oauth_token = token('oauth_token');
    }

    function timenonce(o) {
        o.oauth_timestamp = ohauth.timestamp();
        o.oauth_nonce = ohauth.nonce();
        return o;
    }

    // token getter/setter, namespaced to the current `apibase` value.
    function token(k, x) {
        if (arguments.length == 2) {
            localStorage[keyclean(baseurl) + k] = x;
        }
        return localStorage[keyclean(baseurl) + k];
    }

    oauth.authenticated = function() {
        return token('oauth_token') && token('oauth_token_secret');
    };

    oauth.logout = function() {
        token('oauth_token', '');
        token('oauth_token_secret', '');
        token('oauth_request_token_secret', '');
        return oauth;
    };

    oauth.xhr = function(options, callback) {
        if (token('oauth_token')) {
            o.oauth_token = token('oauth_token');
        }
        o = timenonce(o);
        var url = baseurl + options.path;
        var oauth_token_secret = token('oauth_token_secret');
        o.oauth_signature = ohauth.signature(oauth_secret, oauth_token_secret,
            ohauth.baseString(options.method, url, o));
        ohauth.xhr(options.method, url, o, options.content, options.options, function(err, xhr) {
            if (xhr.responseXML) callback(err, xhr.responseXML);
            else callback(err, xhr.response);
        });
    };

    oauth.authenticate = function(callback) {
        if (oauth.authenticated()) return callback();

        oauth.logout();

        o = timenonce(o);
        var url = baseurl + '/oauth/request_token';
        o.oauth_signature = ohauth.signature(oauth_secret, '',
            ohauth.baseString('POST', url, o));

        var l = iD.loading('contacting openstreetmap...');

        // it would make more sense to have this code within the callback
        // to oauth.xhr below. however, it needs to be directly within a
        // browser event handler in order to open a popup without it being
        // blocked.
        var w = 600, h = 550,
            settings = [
                ['width', w], ['height', h],
                ['left', screen.width / 2 - w / 2],
                ['top', screen.height / 2 - h / 2]].map(function(x) {
                    return x.join('=');
                }).join(','),
            popup = window.open("about:blank", 'oauth_window', settings),
            locationCheck = window.setInterval(function() {
                if (popup.closed) return window.clearInterval(locationCheck);
                if (popup.location.search) {
                    var search = popup.location.search,
                        oauth_token = ohauth.stringQs(search.slice(1));
                    popup.close();
                    get_access_token(oauth_token);
                    window.clearInterval(locationCheck);
                }
            }, 100);

        ohauth.xhr('POST', url, o, null, {}, function(err, xhr) {
            if (err) callback(err);
            l.remove();

            var resp = ohauth.stringQs(xhr.response);
            token('oauth_request_token_secret', resp.oauth_token_secret);

            popup.location = baseurl + '/oauth/authorize?' + ohauth.qsString({
                oauth_token: resp.oauth_token,
                oauth_callback: location.href.replace('index.html', '')
                    .replace(/#.+/, '') + 'land.html'
            });
        });

        function get_access_token(oauth_token) {
            var url = baseurl + '/oauth/access_token';
            o = timenonce(o);

            o.oauth_token = oauth_token.oauth_token;
            var request_token_secret = token('oauth_request_token_secret');
            o.oauth_signature = ohauth.signature(oauth_secret, request_token_secret,
                ohauth.baseString('POST', url, o));
            var l = iD.loading('contacting openstreetmap...');
            ohauth.xhr('POST', url, o, null, {}, function(err, xhr) {
                if (err) callback(err);
                l.remove();
                var access_token = ohauth.stringQs(xhr.response);
                token('oauth_token', access_token.oauth_token);
                token('oauth_token_secret', access_token.oauth_token_secret);
                callback();
            });
        }

    };

    oauth.url = function(_) {
        if (!arguments.length) return baseurl;
        baseurl = _;
        return oauth;
    };

    return oauth;
};
