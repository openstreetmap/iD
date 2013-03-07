iD.OAuth = function(context) {
    var baseurl = 'http://www.openstreetmap.org',
        o = {},
        keys,
        oauth = {},
        oauth_secret;

    function timenonce(o) {
        o.oauth_timestamp = ohauth.timestamp();
        o.oauth_nonce = ohauth.nonce();
        return o;
    }

    // token getter/setter, namespaced to the current `apibase` value.
    function token() {
        return context.storage.apply(context, arguments);
    }

    if (token('oauth_token')) {
        o.oauth_token = token('oauth_token');
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
        function done(err, xhr) {
            if (err) return callback(err);
            if (xhr.responseXML) return callback(err, xhr.responseXML);
            else return callback(err, xhr.response);
        }
        ohauth.xhr(options.method,
            url, o, options.content, options.options, done);
    };

    oauth.authenticate = function(callback) {
        if (oauth.authenticated()) return callback();

        oauth.logout();

        setAuth();
        o = timenonce(o);

        var url = baseurl + '/oauth/request_token';
        o.oauth_signature = ohauth.signature(oauth_secret, '',
            ohauth.baseString('POST', url, o));

        var l = iD.ui.loading(context.container(), 'contacting openstreetmap...');

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
            popup = window.open("about:blank", 'oauth_window', settings);

        window.authComplete = function(token) {
            var oauth_token = ohauth.stringQs(token);
            get_access_token(oauth_token);
            delete window.authComplete;
        };

        function reqTokenDone(err, xhr) {
            if (err) callback(err);
            l.remove();

            var resp = ohauth.stringQs(xhr.response);
            token('oauth_request_token_secret', resp.oauth_token_secret);

            popup.location = baseurl + '/oauth/authorize?' + ohauth.qsString({
                oauth_token: resp.oauth_token,
                oauth_callback: location.href.replace('index.html', '')
                    .replace(/#.+/, '') + 'land.html'
            });
        }

        ohauth.xhr('POST', url, o, null, {}, reqTokenDone);

        function get_access_token(oauth_token) {
            var url = baseurl + '/oauth/access_token';
            o = timenonce(o);

            o.oauth_token = oauth_token.oauth_token;
            var request_token_secret = token('oauth_request_token_secret');
            o.oauth_signature = ohauth.signature(oauth_secret, request_token_secret,
                ohauth.baseString('POST', url, o));
            var l = iD.ui.loading(context.container(), 'contacting openstreetmap...');

            function accessTokenDone(err, xhr) {
                if (err) callback(err);
                l.remove();
                var access_token = ohauth.stringQs(xhr.response);
                token('oauth_token', access_token.oauth_token);
                token('oauth_token_secret', access_token.oauth_token_secret);
                callback();
            }

            ohauth.xhr('POST', url, o, null, {}, accessTokenDone);
        }

    };

    function setAuth() {
        if (baseurl && keys && keys[baseurl]) {
            o = _.assign({}, _.omit(keys[baseurl], 'oauth_secret'));
            oauth_secret = keys[baseurl].oauth_secret;
        }
    }

    oauth.url = function(_) {
        if (!arguments.length) return baseurl;
        baseurl = _;
        setAuth();
        return oauth;
    };

    oauth.keys = function(_) {
        if (!arguments.length) return keys;
        keys = _;
        setAuth();
        return oauth;
    };

    return oauth;
};
