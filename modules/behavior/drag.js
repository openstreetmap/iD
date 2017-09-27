import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    customEvent as d3_customEvent,
    event as d3_event,
    mouse as d3_mouse,
    select as d3_select,
    selection as d3_selection,
    touches as d3_touches
} from 'd3-selection';

import { utilRebind } from '../util/rebind';

import {
    utilPrefixCSSProperty,
    utilPrefixDOMProperty
} from '../util';


/*
    `behaviorDrag` is like `d3_behavior.drag`, with the following differences:

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
 */

export function behaviorDrag() {
    var event = d3_dispatch('start', 'move', 'end'),
        origin = null,
        selector = '',
        filter = null,
        event_, target, surface;


    var d3_event_userSelectProperty = utilPrefixCSSProperty('UserSelect'),
        d3_event_userSelectSuppress = function() {
            var selection = d3_selection(),
                select = selection.style(d3_event_userSelectProperty);
            selection.style(d3_event_userSelectProperty, 'none');
            return function() {
                selection.style(d3_event_userSelectProperty, select);
            };
        };


    function d3_eventCancel() {
        d3_event.stopPropagation();
        d3_event.preventDefault();
    }


    function eventOf(thiz, argumentz) {
        return function(e1) {
            e1.target = drag;
            d3_customEvent(e1, event.apply, event, [e1.type, thiz, argumentz]);
        };
    }


    function dragstart() {
        target = this;
        event_ = eventOf(target, arguments);

        var eventTarget = d3_event.target,
            touchId = d3_event.touches ? d3_event.changedTouches[0].identifier : null,
            offset,
            origin_ = point(),
            started = false,
            selectEnable = d3_event_userSelectSuppress(touchId !== null ? 'drag-' + touchId : 'drag');

        d3_select(window)
            .on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', dragmove)
            .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', dragend, true);

        if (origin) {
            offset = origin.apply(target, arguments);
            offset = [offset[0] - origin_[0], offset[1] - origin_[1]];
        } else {
            offset = [0, 0];
        }

        if (touchId === null) {
            d3_event.stopPropagation();
        }


        function point() {
            var p = surface || target.parentNode;
            return touchId !== null ? d3_touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3_mouse(p);
        }


        function dragmove() {
            var p = point(),
                dx = p[0] - origin_[0],
                dy = p[1] - origin_[1];

            if (dx === 0 && dy === 0)
                return;

            if (!started) {
                started = true;
                event_({ type: 'start' });
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
                event_({ type: 'end' });

                d3_eventCancel();
                if (d3_event.target === eventTarget) {
                    d3_select(window)
                        .on('click.drag', click, true);
                }
            }

            d3_select(window)
                .on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', null)
                .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', null);

            selectEnable();
        }


        function click() {
            d3_eventCancel();
            d3_select(window)
                .on('click.drag', null);
        }
    }


    function drag(selection) {
        var matchesSelector = utilPrefixDOMProperty('matchesSelector'),
            delegate = dragstart;

        if (selector) {
            delegate = function() {
                var root = this,
                    target = d3_event.target;
                for (; target && target !== root; target = target.parentNode) {
                    if (target[matchesSelector](selector) &&
                            (!filter || filter(target.__data__))) {
                        return dragstart.call(target, target.__data__);
                    }
                }
            };
        }

        selection
            .on('mousedown.drag' + selector, delegate)
            .on('touchstart.drag' + selector, delegate);
    }


    drag.off = function(selection) {
        selection
            .on('mousedown.drag' + selector, null)
            .on('touchstart.drag' + selector, null);
    };


    drag.selector = function(_) {
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
        d3_select(window)
            .on('mousemove.drag', null)
            .on('mouseup.drag', null);
        return drag;
    };


    drag.target = function() {
        if (!arguments.length) return target;
        target = arguments[0];
        event_ = eventOf(target, Array.prototype.slice.call(arguments, 1));
        return drag;
    };


    drag.surface = function() {
        if (!arguments.length) return surface;
        surface = arguments[0];
        return drag;
    };


    return utilRebind(drag, event, 'on');
}
