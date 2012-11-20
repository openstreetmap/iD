iD.OAuth = function(map) {
    var baseurl = 'http://api06.dev.openstreetmap.org',
        apibase = 'http://api06.dev.openstreetmap.org/api/0.6',
        oauth_secret = 'aMnOOCwExO2XYtRVWJ1bI9QOdqh1cay2UgpbhA6p',
        oauth = {};

    var o = {
        oauth_consumer_key: 'zwQZFivccHkLs3a8Rq5CoS412fE5aPCXDw9DZj7R',
        oauth_signature_method: 'HMAC-SHA1'
    };

    if (localStorage.oauth_token) {
        o.oauth_token = localStorage.oauth_token;
    }

    function timenonce(o) {
        o.oauth_timestamp = ohauth.timestamp();
        o.oauth_nonce = ohauth.nonce();
        return o;
    }

    oauth.authenticated = function() {
        return localStorage.oauth_token &&
            localStorage.oauth_token_secret;
    };

    oauth.xhr = function(options, callback) {
        if (localStorage.oauth_token) {
            o.oauth_token = localStorage.oauth_token;
        }
        o = timenonce(o);
        var url = apibase + options.path;
        var oauth_token_secret = localStorage.oauth_token_secret;
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

        var d = document.body.appendChild(document.createElement('div')),
            ifr = d.appendChild(document.createElement('iframe'));
        d.className = 'modal';
        ifr.frameborder = 'no';
        ifr.width = 600;
        ifr.height = 400;

        o = timenonce(o);
        var url = baseurl + '/oauth/request_token';
        o.oauth_signature = ohauth.signature(oauth_secret, '',
            ohauth.baseString('POST', url, o));

        ohauth.xhr('POST', url, o, null, {}, function(xhr) {
            var token = ohauth.stringQs(xhr.response);
            localStorage.oauth_request_token_secret = token.oauth_token_secret;
            var at = baseurl + '/oauth/authorize?';
            ifr.src = at + ohauth.qsString({
                oauth_token: token.oauth_token, oauth_callback: location.href
            });
        });
        ifr.onload = function() {
            if (ifr.contentWindow.location.search) {
                var search = ifr.contentWindow.location.search,
                    oauth_token = ohauth.stringQs(search.slice(1)),
                    url = baseurl + '/oauth/access_token';
                o = timenonce(o);
                d.parentNode.removeChild(d);

                o.oauth_token = oauth_token.oauth_token;
                var request_token_secret = localStorage.oauth_request_token_secret;
                o.oauth_signature = ohauth.signature(oauth_secret, request_token_secret,
                    ohauth.baseString('POST', url, o));
                ohauth.xhr('POST', url, o, null, {}, function(xhr) {
                    var access_token = ohauth.stringQs(xhr.response);
                    localStorage.oauth_token = access_token.oauth_token;
                    localStorage.oauth_token_secret = access_token.oauth_token_secret;
                    callback();
                });
            }
        };
    };

    oauth.setAPI = function(x) {
        apibase = x;
        return oauth;
    };

    map.oauth = oauth;

    return oauth;
};
