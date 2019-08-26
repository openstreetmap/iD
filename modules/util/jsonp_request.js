import { select as d3_select } from 'd3-selection';

var jsonpCache = {};
window.jsonpCache = jsonpCache;

export function jsonpRequest(url, callback) {
    var request = {
        abort: function() {}
    };

    if (window.JSONP_FIX) {
        if (window.JSONP_DELAY === 0) {
            callback(window.JSONP_FIX);
        } else {
            var t = window.setTimeout(function() {
                callback(window.JSONP_FIX);
            }, window.JSONP_DELAY || 0);

            request.abort = function() { window.clearTimeout(t); };
        }

        return request;
    }

    function rand() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var c = '';
        var i = -1;
        while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
        return c;
    }

    function create(url) {
        var e = url.match(/callback=(\w+)/);
        var c = e ? e[1] : rand();

        jsonpCache[c] = function(data) {
            if (jsonpCache[c]) {
                callback(data);
            }
            finalize();
        };

        function finalize() {
            delete jsonpCache[c];
            script.remove();
        }

        request.abort = finalize;
        return 'jsonpCache.' + c;
    }

    var cb = create(url);

    var script = d3_select('head')
        .append('script')
        .attr('type', 'text/javascript')
        .attr('src', url.replace(/(\{|%7B)callback(\}|%7D)/, cb));

    return request;
}
