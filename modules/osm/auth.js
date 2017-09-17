osmAuth = function () {
  var o = {}
  return {
    authenticated: function () { return true },
    logout: function () { return this },
    authenticate: function (cb) { return cb() },
    bootstrapToken: function (token, cb) { cb(null, this) },
    xhr: function (opts, cb) {
      console.log(opts.method, opts.path, {
        headers: (opts.options || {}).header || {}
      })
      var xhr = d3.xhr(o.url + opts.path)
      var headers = (opts.options || {}).header || {}
      Object.keys(headers).forEach(function (name) {
        xhr.header(name, headers[name])
      })
      var data = (opts.content == null) ? undefined : opts.content
      xhr.send(opts.method, data, function (err, xhr) {
        cb(err, xhr.response)
      })
    },
    preauth: function (c) {},
    options: function (_) {
      if (!arguments.length) return o
      o = _
      o.url = o.url || 'http://www.openstreetmap.org'
    }
  }
}
