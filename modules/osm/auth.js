import { request } from 'd3-request';

 export function osmAuth () {
  var o = {};
  return {
    authenticated: function () { return true; },
    logout: function () { return this; },
    authenticate: function (cb) { return cb(); },
    bootstrapToken: function (token, cb) { cb(null, this); },
    xhr: function (opts, cb) {
      var xhr = request(o.url + opts.path);
      var headers = (opts.options || {}).header || {};
      Object.keys(headers).forEach(function (name) {
        xhr.header(name, headers[name]);
      });
      var data = (opts.content == null) ? undefined : opts.content;
      xhr.send(opts.method, data, function (err, xhr) {
        if (err) return cb(err);
        else if (xhr.responseXML) return cb(null, xhr.responseXML);
        else return cb(null, xhr.response);
      });
    },
    preauth: function (c) {},
    options: function (_) {
      if (!arguments.length) return o;
      o = _;
      o.url = o.url || 'http://www.openstreetmap.org';
    }
  };
}
