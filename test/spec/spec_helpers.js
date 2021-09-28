/* globals chai:false */
/* eslint no-extend-native:off */
iD.debug = true;

// Disable things that use the network
for (var k in iD.services) { delete iD.services[k]; }

// Try not to load imagery
window.location.hash = '#background=none';

// Run without data for speed (tests which need data can set it up themselves)
iD.fileFetcher.assetPath('../dist/');
var cached = iD.fileFetcher.cache();

// Initializing `coreContext` will try loading the locale data and English locale strings:
cached.locales = { en: { rtl: false, pct: 1 } };
cached.locales_index_general = { en: { rtl: false, pct: 1 } };
cached.locales_index_tagging = { en: { rtl: false, pct: 1 } };

// Use fake data for the 'tagging' scope
cached.locale_tagging_en = {
  en: {
    presets: {
      fields: {
        restrictions: {
          label: 'Turn Restrictions'
        },
        access: {
          label: 'Allowed Access',
          placeholder: 'Not Specified',
          types: {
            access: 'All',
            foot: 'Foot',
            motor_vehicle: 'Motor Vehicles',
            bicycle: 'Bicycles',
            horse: 'Horses'
          },
          options: {
            yes: {
              title: 'Allowed',
              description: 'Access allowed by law; a right of way'
            },
            no: {
              title: 'Prohibited',
              description: 'Access not allowed to the general public'
            },
            permissive: {
              title: 'Permissive',
              description: 'Access allowed until such time as the owner revokes the permission'
            },
            private: {
              title: 'Private',
              description: 'Access allowed only with permission of the owner on an individual basis'
            },
            designated: {
              title: 'Designated',
              description: 'Access allowed according to signs or specific local laws'
            },
            destination: {
              title: 'Destination',
              description: 'Access allowed only to reach a destination'
            },
            dismount: {
              title: 'Dismount',
              description: 'Access allowed but rider must dismount'
            },
            permit: {
              title: 'Permit',
              description: 'Access allowed only with a valid permit or license'
            }
          }
        }
      }
    }
  }
};

// Load the actual data from `dist/locales/` for the 'general' scope
iD.localizer.loadLocale('en', 'general', 'locales');
// Load the fake data seeded above for the 'tagging' scope
iD.localizer.loadLocale('en', 'tagging');


// Initializing `coreContext` initializes `_background`, which tries loading:
cached.imagery = [];
// Initializing `coreContext` initializes `_presets`, which tries loading:
cached.preset_categories = {};
cached.preset_defaults = {};
cached.preset_fields = {};
cached.preset_presets = {};
// Initializing `coreContext` initializes `_validator`, which tries loading:
cached.deprecated = [];
// Initializing `coreContext` initializes `_uploader`, which tries loading:
cached.discarded = {};


mocha.setup({
    timeout: 5000,  // 5 sec
    ui: 'bdd',
    globals: [
        '__onmousemove.zoom',
        '__onmouseup.zoom',
        '__onkeydown.select',
        '__onkeyup.select',
        '__onclick.draw',
        '__onclick.draw-block'
    ]
});

expect = chai.expect;

window.d3 = iD.d3;   // Remove this if we can avoid exporting all of d3.js
delete window.PointerEvent;  // force the brower to use mouse events

// Workaround for `Array.from` polyfill in PhantomJS
// https://github.com/openstreetmap/iD/issues/6087#issuecomment-476219308
var __arrayfrom = Array.from;
Array.from = function(what) {
    if (what instanceof Set) {
        var arr = [];
        what.forEach(function(v) { arr.push(v); });
        return arr;
    } else {
        return __arrayfrom.apply(null, arguments);
    }
};

// Workaround for `ArrayBuffer.isView` in PhantomJS
// https://github.com/openstreetmap/iD/issues/7072
if (typeof ArrayBuffer.isView === 'undefined') {
    ArrayBuffer.isView = function() { return false; };
}

// Add support for sinon-stubbing `fetch` API
// (sinon fakeServer works only on `XMLHttpRequest`)
// see https://github.com/sinonjs/nise/issues/7
//
// None of the alternatives really worked well,
// so I'm just wrapping the `fake-fetch` methods in here.
//   - https://github.com/msn0/fake-fetch
//   - https://github.com/wheresrhys/fetch-mock

window.fakeFetch = function() {
    var _responders = [];
    var _requests = [];

    function fake(url, options) {
        options = Object.assign({ method: 'get', headers: {}, body: '' }, options);
        return new Promise(function(resolve, reject) {
            _requests.push({
                url: url, options: options, resolve: resolve, reject: reject, processed: false
            });
        });
    }

    return {
        requests: function() {
            return _requests;
        },

        create: function () {
            _responders = [];
            _requests = [];
            sinon.stub(window, 'fetch').callsFake(fake);
            return this;
        },

        restore: function () {
            window.fetch.restore();
        },

        getUrl: function () {
            return window.fetch.firstCall.args[0];
        },

        getOptions: function () {
            return window.fetch.firstCall.args[1] || {};
        },

        getMethod: function () {
            return this.getOptions().method || 'get';
        },

        getBody: function () {
            return this.getOptions().body || '';
        },

        getRequestHeaders: function () {
            return this.getOptions().headers || {};
        },

        respondWith: function(method, match, response) {
            var status = 200;
            var headers = { 'Content-Type': 'text/html' };
            var body = 'OK';

            if (typeof response === 'string') {
                body = response;
            } else if (Array.isArray(response) && response.length === 3) {
                status = response[0];
                headers = Object.assign(headers, response[1] || {});
                body = response[2];
            }

            headers['Content-Length'] = body.length;
            var data = new Blob([body], { type: headers['Content-Type'] });
            var options = { status: status, headers: headers };

            _responders.push({
                method: method,
                match: match,
                respond: function() { return new Response(data, options); }
            });
        },

        respond: function () {
            _requests.forEach(function(request) {
                if (request.processed) return;

                var didMatch = false;
                for (var i = 0; i < _responders.length; i++) {
                    var responder = _responders[i];
                    if (responder.method.toLowerCase() !== request.options.method.toLowerCase()) {
                        continue;   // skip if method doesn't match (get/post)
                    }

                    if (responder.match.constructor.name === 'RegExp') {
                        didMatch = responder.match.test(request.url);
                    } else if (typeof responder.match === 'string') {
                        didMatch = (request.url.indexOf(responder.match) !== -1);
                    }

                    if (didMatch) {
                        request.processed = true;
                        request.resolve(responder.respond());
                        break;
                    }
                }
                if (!didMatch) {
                    request.processed = true;
                    request.reject(new Response(
                        new Blob(['404'], { type: 'text/plain' }),
                        { status: 404, statusText: 'Not Found' }
                    ));
                }
            });
        }
    };
};
