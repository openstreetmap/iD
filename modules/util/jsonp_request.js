import * as d3 from 'd3';
var jsonpCache = {};
window.jsonpCache = jsonpCache;

export function jsonpRequest(url, callback) {

  if (window.JSONP_FIX) {
    if (window.JSONP_DELAY === 0) {
      callback(window.JSONP_FIX);
    } else {
      setTimeout(function() {
        callback(window.JSONP_FIX);
      }, window.JSONP_DELAY || 0);
    }
    return;
  }

  function rand() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      c = '', i = -1;
    while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
    return c;
  }

  function create(url) {
    var e = url.match(/callback=(\w+)/),
      c = e ? e[1] : rand();
    jsonpCache[c] = function(data) {
      callback(data);
      delete jsonpCache[c];
      script.remove();
    };
    return 'jsonpCache.' + c;
  }

  var cb = create(url),
    script = d3.select('head')
    .append('script')
    .attr('type', 'text/javascript')
    .attr('src', url.replace(/(\{|%7B)callback(\}|%7D)/, cb));
}
