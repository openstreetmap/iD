import { rebind } from '../util/rebind';
import * as d3 from 'd3';
import { prefixCSSProperty, prefixDOMProperty } from '../util/index';
/*
    `iD.behavior.drag` is like `d3.behavior.drag`, with the following differences:

    * The `origin` function is expected to return an [x, y] tuple rather than an
      {x, y} object.
    * The events are `start`, `move`, and `end`.
      (https://github.com/mbostock/d3/issues/563)
    * The `start` event is not dispatched until the first cursor movement occurs.
      (https://github.com/mbostock/d3/pull/368)
    * The `move` event has a `point` and `delta` [x, y] tuple properties rather
      than `x`, `y`, `dx`, and `dy` properties.
    * The `end` event is not dispatched if no movement occurs.
    * An `off` function is available that unbinds the drag's internal event handlers.
    * Delegation is supported via the `delegate` function.

 */
export function drag() {
    function d3_eventCancel() {
      d3.event.stopPropagation();
      d3.event.preventDefault();
    }

    var event = d3.dispatch('start', 'move', 'end'),
        origin = null,
        selector = '',
        filter = null,
        event_, target, surface;

    event.of = function(thiz, argumentz) {
      return function(e1) {
        var e0 = e1.sourceEvent = d3.event;
        e1.target = drag;
        // TODO
        // d3.event = e1;
        try {
          event[e1.type].apply(thiz, argumentz);
        } finally {
          // d3.event = e0;
        }
      };
    };

    var d3_event_userSelectProperty = prefixCSSProperty('UserSelect'),
        d3_event_userSelectSuppress = d3_event_userSelectProperty ?
            function () {
                var selection = d3.selection(),
                    select = selection.style(d3_event_userSelectProperty);
                selection.style(d3_event_userSelectProperty, 'none');
                return function () {
                    selection.style(d3_event_userSelectProperty, select);
                };
            } :
            function (type) {
                var w = d3.select(window).on('selectstart.' + type, d3_eventCancel);
                return function () {
                    w.on('selectstart.' + type, null);
                };
            };

    function mousedown() {
        target = this;
        event_ = event.call("of", target, arguments);
        var eventTarget = d3.event.target,
            touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
            offset,
            origin_ = point(),
            started = false,
            selectEnable = d3_event_userSelectSuppress(touchId !== null ? 'drag-' + touchId : 'drag');

        var w = d3.select(window)
            .on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', dragmove)
            .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', dragend, true);

        if (origin) {
            offset = origin.apply(target, arguments);
            offset = [offset[0] - origin_[0], offset[1] - origin_[1]];
        } else {
            offset = [0, 0];
        }

        if (touchId === null) d3.event.stopPropagation();

        function point() {
            var p = target.parentNode || surface;
            return touchId !== null ? d3.touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3.mouse(p);
        }

        function dragmove() {

            var p = point(),
                dx = p[0] - origin_[0],
                dy = p[1] - origin_[1];

            if (dx === 0 && dy === 0)
                return;

            if (!started) {
                started = true;
                event_({
                    type: 'start'
                });
            }

            origin_ = p;
            d3_eventCancel();

            event_({
                type: 'move',
                point: [p[0] + offset[0],  p[1] + offset[1]],
                delta: [dx, dy]
            });
        }

        function dragend() {
            if (started) {
                event_({
                    type: 'end'
                });

                d3_eventCancel();
                if (d3.event.target === eventTarget) w.on('click.drag', click, true);
            }

            w.on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', null)
                .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', null);
            selectEnable();
        }

        function click() {
            d3_eventCancel();
            w.on('click.drag', null);
        }
    }

    function drag(selection) {
        var matchesSelector = prefixDOMProperty('matchesSelector'),
            delegate = mousedown;

        if (selector) {
            delegate = function() {
                var root = this,
                    target = d3.event.target;
                for (; target && target !== root; target = target.parentNode) {
                    if (target[matchesSelector](selector) &&
                            (!filter || filter(target.__data__))) {
                        return mousedown.call(target, target.__data__);
                    }
                }
            };
        }

        selection.on('mousedown.drag' + selector, delegate)
            .on('touchstart.drag' + selector, delegate);
    }

    drag.off = function(selection) {
        selection.on('mousedown.drag' + selector, null)
            .on('touchstart.drag' + selector, null);
    };

    drag.delegate = function(_) {
        if (!arguments.length) return selector;
        selector = _;
        return drag;
    };

    drag.filter = function(_) {
        if (!arguments.length) return origin;
        filter = _;
        return drag;
    };

    drag.origin = function (_) {
        if (!arguments.length) return origin;
        origin = _;
        return drag;
    };

    drag.cancel = function() {
        d3.select(window)
            .on('mousemove.drag', null)
            .on('mouseup.drag', null);
        return drag;
    };

    drag.target = function() {
        if (!arguments.length) return target;
        target = arguments[0];
        event_ = event.call("of", target, Array.prototype.slice.call(arguments, 1));
        return drag;
    };

    drag.surface = function() {
        if (!arguments.length) return surface;
        surface = arguments[0];
        return drag;
    };

    return rebind(drag, event, 'on');
}
