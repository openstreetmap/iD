// Adapted from d3-zoom to handle pointer events.
// https://github.com/d3/d3-zoom/blob/523ccff340187a3e3c044eaa4d4a7391ea97272b/src/zoom.js

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { interpolateZoom } from 'd3-interpolate';
import { event as d3_event, customEvent as d3_customEvent, select as d3_select, mouse as d3_mouse } from 'd3-selection';
import { interrupt as d3_interrupt } from 'd3-transition';
import constant from '../../node_modules/d3-zoom/src/constant.js';
import ZoomEvent from '../../node_modules/d3-zoom/src/event.js';
import { Transform, identity } from '../../node_modules/d3-zoom/src/transform.js';

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

function defaultTransform() {
  return this.__zoom || identity;
}

function defaultWheelDelta() {
  return -d3_event.deltaY * (d3_event.deltaMode === 1 ? 0.05 : d3_event.deltaMode ? 1 : 0.002);
}

function defaultTouchable() {
  return navigator.maxTouchPoints || ('ontouchstart' in this);
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
      touchable = defaultTouchable,
      scaleExtent = [0, Infinity],
      translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
      duration = 250,
      interpolate = interpolateZoom,
      listeners = d3_dispatch('start', 'zoom', 'end'),
      touchstarting,
      touchending,
      touchDelay = 500,
      wheelDelay = 150,
      clickDistance2 = 0;

  function zoom(selection) {
    selection
        .property('__zoom', defaultTransform)
        .on('dblclick.zoom', dblclicked)
        .on('pointerdown.zoom', pointerdown)
        .on('pointermove.zoom', pointermove)
        .on('pointerup.zoom pointercancel.zoom', pointerup)
        .on('wheel.zoom', wheeled)
        .style('touch-action', 'none')
        .style('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');
  }

  zoom.transform = function(collection, transform, point) {
    var selection = collection.selection ? collection.selection() : collection;
    selection.property('__zoom', defaultTransform);
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
      var k0 = this.__zoom.k,
          k1 = typeof k === 'function' ? k.apply(this, arguments) : k;
      return k0 * k1;
    }, p);
  };

  zoom.scaleTo = function(selection, k, p) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t0 = this.__zoom,
          p0 = p == null ? centroid(e) : typeof p === 'function' ? p.apply(this, arguments) : p,
          p1 = t0.invert(p0),
          k1 = typeof k === 'function' ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
    }, p);
  };

  zoom.translateBy = function(selection, x, y) {
    zoom.transform(selection, function() {
      return constrain(this.__zoom.translate(
        typeof x === 'function' ? x.apply(this, arguments) : x,
        typeof y === 'function' ? y.apply(this, arguments) : y
      ), extent.apply(this, arguments), translateExtent);
    });
  };

  zoom.translateTo = function(selection, x, y, p) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t = this.__zoom,
          p0 = p == null ? centroid(e) : typeof p === 'function' ? p.apply(this, arguments) : p;
      return constrain(identity.translate(p0[0], p0[1]).scale(t.k).translate(
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
              a = that.__zoom,
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
    return (!clean && that.__zooming) || new Gesture(that, args);
  }

  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.extent = extent.apply(that, args);
    this.taps = 0;
  }

  Gesture.prototype = {
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit('start');
      }
      return this;
    },
    zoom: function(key, transform) {
      if (this.mouse && key !== 'mouse') this.mouse[1] = transform.invert(this.mouse[0]);
      if (this.touch0 && key !== 'touch') this.touch0[1] = transform.invert(this.touch0[0]);
      if (this.touch1 && key !== 'touch') this.touch1[1] = transform.invert(this.touch1[0]);
      this.that.__zoom = transform;
      this.emit('zoom');
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit('end');
      }
      return this;
    },
    emit: function(type) {
      d3_customEvent(new ZoomEvent(zoom, type, this.that.__zoom), listeners.apply, listeners, [type, this.that, this.args]);
    }
  };

  function wheeled() {
    if (!filter.apply(this, arguments)) return;
    var g = gesture(this, arguments),
        t = this.__zoom,
        k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
        p = d3_mouse(this);

    // If the mouse is in the same location as before, reuse it.
    // If there were recent wheel events, reset the wheel idle timeout.
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    }

    // If this wheel event won’t trigger a transform change, ignore it.
    else if (t.k === k) return;

    // Otherwise, capture the mouse point and location at the start.
    else {
      g.mouse = [p, t.invert(p)];
      d3_interrupt(this);
      g.start();
    }

    d3_event.preventDefault();
    d3_event.stopImmediatePropagation();
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom('mouse', constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }

  function dblclicked() {
    if (!filter.apply(this, arguments)) return;
    var t0 = this.__zoom,
        p0 = d3_mouse(this),
        p1 = t0.invert(p0),
        k1 = t0.k * (d3_event.shiftKey ? 0.5 : 2),
        t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, arguments), translateExtent);

    d3_event.preventDefault();
    d3_event.stopImmediatePropagation();
    if (duration > 0) d3_select(this).transition().duration(duration).call(schedule, t1, p0);
    else d3_select(this).call(zoom.transform, t1);
  }

  var downPointerIDs = new Set();

  function pointerdown() {
    downPointerIDs.add(d3_event.pointerId);

    if (!filter.apply(this, arguments)) return;

    var g = gesture(this, arguments, downPointerIDs.size === 1);
    var started;

    d3_event.stopImmediatePropagation();
    var loc = d3_mouse(this);
    var p = [loc, this.__zoom.invert(loc), d3_event.pointerId];
    if (!g.touch0) {
       g.touch0 = p;
       started = true;
       g.taps = 1 + !!touchstarting;

    } else if (!g.touch1 && g.touch0[2] !== p[2]) {
       g.touch1 = p;
       g.taps = 0;
    }

    if (touchstarting) touchstarting = clearTimeout(touchstarting);

    if (started) {
      if (g.taps < 2) touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
      d3_interrupt(this);
      g.start();
    }
  }

  function pointermove() {
    if (!this.__zooming) return;

    var loc = d3_mouse(this);

    var g = gesture(this, arguments);
    var t, p, l;

    d3_event.preventDefault();
    d3_event.stopImmediatePropagation();
    if (touchstarting) touchstarting = clearTimeout(touchstarting);
    g.taps = 0;

    if (g.touch0 && g.touch0[2] === d3_event.pointerId) g.touch0[0] = loc;
    else if (g.touch1 && g.touch1[2] === d3_event.pointerId) g.touch1[0] = loc;

    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1],
          p1 = g.touch1[0], l1 = g.touch1[1],
          dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
          dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    } else if (g.touch0) {
      p = g.touch0[0];
      l = g.touch0[1];
    }
    else return;
    g.zoom('touch', constrain(translate(t, p, l), g.extent, translateExtent));
  }

  function pointerup() {
    downPointerIDs.delete(d3_event.pointerId);

    if (!this.__zooming) return;

    var g = gesture(this, arguments);

    d3_event.stopImmediatePropagation();
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, touchDelay);

    if (g.touch0 && g.touch0[2] === d3_event.pointerId) delete g.touch0;
    else if (g.touch1 && g.touch1[2] === d3_event.pointerId) delete g.touch1;

    if (g.touch1 && !g.touch0) {
      g.touch0 = g.touch1;
      delete g.touch1;
    }
    if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
    else {
      g.end();
      // If this was a dbltap, reroute to the (optional) dblclick.zoom handler.
      if (g.taps === 2) {
        // This currently never appears to be called but mobile Safari still
        // seems to get regular dblclick events upon double-tapping.
        var p = d3_select(this).on('dblclick.zoom');
        if (p) p.apply(this, arguments);
      }
    }
  }

  zoom.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta = typeof _ === 'function' ? _ : constant(+_), zoom) : wheelDelta;
  };

  zoom.filter = function(_) {
    return arguments.length ? (filter = typeof _ === 'function' ? _ : constant(!!_), zoom) : filter;
  };

  zoom.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === 'function' ? _ : constant(!!_), zoom) : touchable;
  };

  zoom.extent = function(_) {
    return arguments.length ? (extent = typeof _ === 'function' ? _ : constant([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
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

  zoom.duration = function(_) {
    return arguments.length ? (duration = +_, zoom) : duration;
  };

  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate = _, zoom) : interpolate;
  };

  zoom.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom : value;
  };

  zoom.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
  };

  return zoom;
}
