d3.clip = {};

d3.clip.cohenSutherland = function() {
    var xmin = 0, xmax = 0, ymin = 0, ymax = 0;

    var x = function(d) {
      return d[0];
    };

    var y = function(d) {
      return d[1];
    };

    var INSIDE = 0; // 0000
    var LEFT   = 1; // 0001
    var RIGHT  = 2; // 0010
    var BOTTOM = 4; // 0100
    var TOP    = 8; // 1000

    function outCode(x, y) {
        var code = INSIDE;

        if (x < xmin)
            code |= LEFT;
        else if (x > xmax)
            code |= RIGHT;

        if (y < ymin)
            code |= BOTTOM;
        else if (y > ymax)
            code |= TOP;

        return code;
    }

    function clip(data) {
      var segments = [],
          points = [],
          i = 0,
          n = data.length,
          x0, y0, x1, y1, c0, c1, _x0, _y0, _x1, _y1, _c0, _c1,
          fx = d3.functor(x),
          fy = d3.functor(y);

      function segment() {
          segments.push(points);
          points = [];
      }

      if (n) {
          x0 = +fx.call(this, data[0], 0);
          y0 = +fy.call(this, data[0], 0);
          c0 = outCode(x0, y0);
          if (!c0) points.push([x0, y0]);
      }

      while (++i < n) {
          x1 = +fx.call(this, data[i], i);
          y1 = +fy.call(this, data[i], i);
          c1 = outCode(x1, y1);

          _x0 = x0;
          _y0 = y0;
          _x1 = x1;
          _y1 = y1;
          _c0 = c0;
          _c1 = c1;

          while (true) {
              if (!(_c0 | _c1)) {
                  if (c0) points.push([_x0, _y0]);
                  points.push([_x1, _y1]);
                  if (c1) segment();
                  break;
              } else if (_c0 & _c1) {
                  break;
              } else {
                  var _x, _y, outcodeOut = _c0 ? _c0 : _c1;

                  if (outcodeOut & TOP) {
                      _x = _x0 + (_x1 - _x0) * (ymax - _y0) / (_y1 - _y0);
                      _y = ymax;
                  } else if (outcodeOut & BOTTOM) {
                      _x = _x0 + (_x1 - _x0) * (ymin - _y0) / (_y1 - _y0);
                      _y = ymin;
                  } else if (outcodeOut & RIGHT) {
                      _y = _y0 + (_y1 - _y0) * (xmax - _x0) / (_x1 - _x0);
                      _x = xmax;
                  } else if (outcodeOut & LEFT) {
                      _y = _y0 + (_y1 - _y0) * (xmin - _x0) / (_x1 - _x0);
                      _x = xmin;
                  }

                  if (outcodeOut == _c0) {
                      _x0 = _x;
                      _y0 = _y;
                      _c0 = outCode(_x0, _y0);
                  } else {
                      _x1 = _x;
                      _y1 = _y;
                      _c1 = outCode(_x1, _y1);
                  }
              }
          }

          x0 = x1;
          y0 = y1;
          c0 = c1;
      }

      if (points.length) segment();
      return segments;
    }

    clip.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return clip;
    };

    clip.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return clip;
    };

    clip.bounds = function(_) {
        if (!arguments.length) return [xmin, ymin, xmax, ymax];
        xmin = _[0];
        ymin = _[1];
        xmax = _[2];
        ymax = _[3];
        return clip;
    };

    return clip;
};
