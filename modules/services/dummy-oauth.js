import ohauth from 'ohauth';

export function dummyOauth(initOptions) {
    let currentOptions = initOptions || {url: 'https://www.openstreetmap.org'};
    return {
        xhr(options, callback) {
            const url = (options.prefix !== false) ? currentOptions.url + options.path : options.path;
            const headers = (options.options && options.options.header) || {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            return ohauth.rawxhr(options.method, url, options.content, headers, done);

            function done(err, xhr) {
                if (err) {
                    return callback(err);
                } else if (xhr.responseXML) {
                    return callback(err, xhr.responseXML);
                } else {
                    return callback(err, xhr.response);
                }
            }

        },
        bootstrapToken(oauth_token, callback) {
            callback(null, this);
        },
        preauth(_) {
            return this;
        },
        options(options) {
            if (options) {
                currentOptions = options;
                return this;
            }
            return currentOptions;
        },
        bringPopupWindowToFront() {
            return true;
        },
        authenticate(callback) {
            return callback();
        },
        authenticated() {
            return true;
        },
        logout() {
            return this;
        }
    };
}
