// Adapted from d3-zoom to handle pointer events.
// https://github.com/d3/d3-zoom/blob/523ccff340187a3e3c044eaa4d4a7391ea97272b/src/zoom.js

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { interpolateZoom } from 'd3-interpolate';
import { event as d3_event, customEvent as d3_customEvent, select as d3_select } from 'd3-selection';
import { interrupt as d3_interrupt } from 'd3-transition';
import { zoomIdentity as d3_zoomIdentity } from 'd3-zoom';
import ZoomEvent from '../../node_modules/d3-zoom/src/event.js';
import { Transform } from '../../node_modules/d3-zoom/src/transform.js';

import { utilFastMouse, utilFunctor } from './util';

// Ignore right-click, since that should open the context menu.
function defaultFilter() {
  return !d3_event.ctrlKey && !d3_event.button;
}

function defaultExtent() {
  var e = this;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    if (e.hasAttribute('viewBox')) {
      e = e.viewBox.baseVal;
      return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    }
    return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
  }
  return [[0, 0], [e.clientWidth, e.clientHeight]];
}

function defaultWheelDelta() {
  return -d3_event.deltaY * (d3_event.deltaMode === 1 ? 0.05 : d3_event.deltaMode ? 1 : 0.002);
}

function defaultConstrain(transform, extent, translateExtent) {
  var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
      dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
      dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
      dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
  return transform.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
  );
}

export function utilZoomPan() {
  var filter = defaultFilter,
      extent = defaultExtent,
      constrain = defaultConstrain,
      wheelDelta = defaultWheelDelta,
      scaleExtent = [0, Infinity],
      translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
      interpolate = interpolateZoom,
      listeners = d3_dispatch('start', 'zoom', 'end'),
      _wheelDelay = 150,
      _transform = d3_zoomIdentity,
      _activeGesture;

  function zoom(selection) {
    selection
        .on('pointerdown.zoom', pointerdown)
        .on('wheel.zoom', wheeled)
        .style('touch-action', 'none')
        .style('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');

    d3_select(window)
        .on('pointermove.zoompan', pointermove)
        .on('pointerup.zoompan pointercancel.zoompan', pointerup);
  }

  zoom.transform = function(collection, transform, point) {
    var selection = collection.selection ? collection.selection() : collection;
    if (collection !== selection) {
      schedule(collection, transform, point);
    } else {
      selection.interrupt().each(function() {
        gesture(this, arguments)
            .start()
            .zoom(null, typeof transform === 'function' ? transform.apply(this, arguments) : transform)
            .end();
      });
    }
  };

  zoom.scaleBy = function(selection, k, p) {
    zoom.scaleTo(selection, function() {
      var k0 = _transform.k,
          k1 = typeof k === 'function' ? k.apply(this, arguments) : k;
      return k0 * k1;
    }, p);
  };

  zoom.scaleTo = function(selection, k, p) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t0 = _transform,
          p0 = p == null ? centroid(e) : typeof p === 'function' ? p.apply(this, arguments) : p,
          p1 = t0.invert(p0),
          k1 = typeof k === 'function' ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
    }, p);
  };

  zoom.translateBy = function(selection, x, y) {
    zoom.transform(selection, function() {
      return constrain(_transform.translate(
        typeof x === 'function' ? x.apply(this, arguments) : x,
        typeof y === 'function' ? y.apply(this, arguments) : y
      ), extent.apply(this, arguments), translateExtent);
    });
  };

  zoom.translateTo = function(selection, x, y, p) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t = _transform,
          p0 = p == null ? centroid(e) : typeof p === 'function' ? p.apply(this, arguments) : p;
      return constrain(d3_zoomIdentity.translate(p0[0], p0[1]).scale(t.k).translate(
        typeof x === 'function' ? -x.apply(this, arguments) : -x,
        typeof y === 'function' ? -y.apply(this, arguments) : -y
      ), e, translateExtent);
    }, p);
  };

  function scale(transform, k) {
    k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
    return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
  }

  function translate(transform, p0, p1) {
    var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
    return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
  }

  function centroid(extent) {
    return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
  }

  function schedule(transition, transform, point) {
    transition
        .on('start.zoom', function() { gesture(this, arguments).start(); })
        .on('interrupt.zoom end.zoom', function() { gesture(this, arguments).end(); })
        .tween('zoom', function() {
          var that = this,
              args = arguments,
              g = gesture(that, args),
              e = extent.apply(that, args),
              p = point == null ? centroid(e) : typeof point === 'function' ? point.apply(that, args) : point,
              w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
              a = _transform,
              b = typeof transform === 'function' ? transform.apply(that, args) : transform,
              i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
          return function(t) {
            if (t === 1) t = b; // Avoid rounding error on end.
            else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
            g.zoom(null, t);
          };
        });
  }

  function gesture(that, args, clean) {
    return (!clean && _activeGesture) || new Gesture(that, args);
  }

  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.extent = extent.apply(that, args);
  }

  Gesture.prototype = {
    start: function() {
      if (++this.active === 1) {
        _activeGesture = this;
        this.emit('start');
      }
      return this;
    },
    zoom: function(key, transform) {
      if (this.mouse && key !== 'mouse') this.mouse[1] = transform.invert(this.mouse[0]);
      if (this.pointer0 && key !== 'touch') this.pointer0[1] = transform.invert(this.pointer0[0]);
      if (this.pointer1 && key !== 'touch') this.pointer1[1] = transform.invert(this.pointer1[0]);
      _transform = transform;
      this.emit('zoom');
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        _activeGesture = null;
        this.emit('end');
      }
      return this;
    },
    emit: function(type) {
      d3_customEvent(new ZoomEvent(zoom, type, _transform), listeners.apply, listeners, [type, this.that, this.args]);
    }
  };

  function wheeled() {
    if (!filter.apply(this, arguments)) return;
    var g = gesture(this, arguments),
        t = _transform,
        k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
        p = utilFastMouse(this)(d3_event);

    // If the mouse is in the same location as before, reuse it.
    // If there were recent wheel events, reset the wheel idle timeout.
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);

    // Otherwise, capture the mouse point and location at the start.
    } else {
      g.mouse = [p, t.invert(p)];
      d3_interrupt(this);
      g.start();
    }

    d3_event.preventDefault();
    d3_event.stopImmediatePropagation();
    g.wheel = setTimeout(wheelidled, _wheelDelay);
    g.zoom('mouse', constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }

  var _downPointerIDs = new Set();
  var _pointerLocGetter;

  function pointerdown() {
    _downPointerIDs.add(d3_event.pointerId);

    if (!filter.apply(this, arguments)) return;

    var g = gesture(this, arguments, _downPointerIDs.size === 1);
    var started;

    d3_event.stopImmediatePropagation();
    _pointerLocGetter = utilFastMouse(this);
    var loc = _pointerLocGetter(d3_event);
    var p = [loc, _transform.invert(loc), d3_event.pointerId];
    if (!g.pointer0) {
       g.pointer0 = p;
       started = true;

    } else if (!g.pointer1 && g.pointer0[2] !== p[2]) {
       g.pointer1 = p;
    }

    if (started) {
      d3_interrupt(this);
      g.start();
    }
  }

  function pointermove() {
    if (!_downPointerIDs.has(d3_event.pointerId)) return;

    if (!_activeGesture || !_pointerLocGetter) return;

    var g = gesture(this, arguments);

    var isPointer0 = g.pointer0 && g.pointer0[2] === d3_event.pointerId;
    var isPointer1 = !isPointer0 && g.pointer1 && g.pointer1[2] === d3_event.pointerId;

    if ((isPointer0 || isPointer1) && 'buttons' in d3_event && !d3_event.buttons) {
      // The pointer went up without ending the gesture somehow, e.g.
      // a down mouse was moved off the map and released. End it here.
      if (g.pointer0) _downPointerIDs.delete(g.pointer0[2]);
      if (g.pointer1) _downPointerIDs.delete(g.pointer1[2]);
      g.end();
      return;
    }

    d3_event.preventDefault();
    d3_event.stopImmediatePropagation();

    var loc = _pointerLocGetter(d3_event);
    var t, p, l;

    if (isPointer0) g.pointer0[0] = loc;
    else if (isPointer1) g.pointer1[0] = loc;

    t = _transform;
    if (g.pointer1) {
      var p0 = g.pointer0[0], l0 = g.pointer0[1],
          p1 = g.pointer1[0], l1 = g.pointer1[1],
          dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
          dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    } else if (g.pointer0) {
      p = g.pointer0[0];
      l = g.pointer0[1];
    }
    else return;
    g.zoom('touch', constrain(translate(t, p, l), g.extent, translateExtent));
  }

  function pointerup() {
    if (!_downPointerIDs.has(d3_event.pointerId)) return;

    _downPointerIDs.delete(d3_event.pointerId);

    if (!_activeGesture) return;

    var g = gesture(this, arguments);

    d3_event.stopImmediatePropagation();

    if (g.pointer0 && g.pointer0[2] === d3_event.pointerId) delete g.pointer0;
    else if (g.pointer1 && g.pointer1[2] === d3_event.pointerId) delete g.pointer1;

    if (g.pointer1 && !g.pointer0) {
      g.pointer0 = g.pointer1;
      delete g.pointer1;
    }
    if (g.pointer0) g.pointer0[1] = _transform.invert(g.pointer0[0]);
    else {
      g.end();
    }
  }

  zoom.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta = utilFunctor(+_), zoom) : wheelDelta;
  };

  zoom.filter = function(_) {
    return arguments.length ? (filter = utilFunctor(!!_), zoom) : filter;
  };

  zoom.extent = function(_) {
    return arguments.length ? (extent = utilFunctor([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
  };

  zoom.scaleExtent = function(_) {
    return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
  };

  zoom.translateExtent = function(_) {
    return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };

  zoom.constrain = function(_) {
    return arguments.length ? (constrain = _, zoom) : constrain;
  };

  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate = _, zoom) : interpolate;
  };

  zoom._transform = function(_) {
    return arguments.length ? (_transform = _, zoom) : _transform;
  };

  zoom.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom : value;
  };

  return zoom;
}
