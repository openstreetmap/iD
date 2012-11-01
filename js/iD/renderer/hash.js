iD.Hash = function() {
  var hash = {},
      s0, // cached location.hash
      lat = 90 - 1e-8, // allowable latitude range
      map;

  var parser = function(map, s) {
    var args = s.split("/").map(Number);
    if (args.length < 3 || args.some(isNaN)) return true; // replace bogus hash
    else {
      map.setZoom(args[0]);
      map.setCenter({lat: Math.min(lat, Math.max(-lat, args[1])), lon: args[2]});
    }
  };

  var formatter = function(map) {
    var center = map.getCenter(),
        zoom = map.getZoom(),
        precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
    return "#" + zoom.toFixed(2) +
             "/" + center.lat.toFixed(precision) +
             "/" + center.lon.toFixed(precision);
  };

  var move = _.throttle(function() {
    var s1 = formatter(map);
    if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
  }, 1000);

  function hashchange() {
    if (location.hash === s0) return; // ignore spurious hashchange events
    if (parser(map, (s0 = location.hash).substring(1)))
      move(); // replace bogus hash
  }

  hash.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      map.off("move", move);
      window.removeEventListener("hashchange", hashchange, false);
    }
    if (map = x) {
      map.on("move", move);
      window.addEventListener("hashchange", hashchange, false);
      location.hash ? hashchange() : move();
    }
    return hash;
  };

  hash.parser = function(x) {
    if (!arguments.length) return parser;
    parser = x;
    return hash;
  };

  hash.formatter = function(x) {
    if (!arguments.length) return formatter;
    formatter = x;
    return hash;
  };

  return hash;
};
