/* globals chai:false */
/* eslint no-extend-native:off */
iD.debug = true;

// disable things that use the network
iD.data.imagery = [];
for (var k in iD.services) { delete iD.services[k]; }

// run with a minimal set of presets for speed
iD.data.presets = {
    presets: {
        area: { name: 'Area', tags: {}, geometry: ['area'] },
        line: { name: 'Line', tags: {}, geometry: ['line'] },
        point: { name: 'Point', tags: {}, geometry: ['point'] },
        vertex: { name: 'Vertex', tags: {}, geometry: ['vertex'] },
        relation: { name: 'Relation', tags: {}, geometry: ['relation'] },
        // for tests related to areaKeys:
        building: { name: 'Building', tags: { building: 'yes' }, geometry: ['point', 'area'] },
        man_made: { name: 'Man Made', tags: { man_made: '*' }, geometry: ['vertex', 'point', 'line', 'area'] }
    }
};


mocha.setup({
    timeout: 60000,  // 1 minute
    ui: 'bdd',
    globals: [
        '__onresize.tail-size',
        '__onmousemove.zoom',
        '__onmouseup.zoom',
        '__onkeydown.select',
        '__onkeyup.select',
        '__onclick.draw',
        '__onclick.draw-block'
    ]
});

expect = chai.expect;

window.d3 = iD.d3;   // TODO: remove if we can avoid exporting all of d3.js

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
