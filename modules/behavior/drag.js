import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    customEvent as d3_customEvent,
    event as d3_event,
    mouse as d3_mouse,
    select as d3_select,
    selection as d3_selection,
    touches as d3_touches
} from 'd3-selection';

import { osmNote } from '../osm';
import { utilRebind } from '../util/rebind';
import { utilPrefixCSSProperty, utilPrefixDOMProperty } from '../util';


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
    var dispatch = d3_dispatch('start', 'move', 'end');
    var _origin = null;
    var _selector = '';
    var _event;
    var _target;
    var _surface;


    var d3_event_userSelectProperty = utilPrefixCSSProperty('UserSelect');
    var d3_event_userSelectSuppress = function() {
            var selection = d3_selection();
            var select = selection.style(d3_event_userSelectProperty);
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
            e1.target = behavior;
            d3_customEvent(e1, dispatch.apply, dispatch, [e1.type, thiz, argumentz]);
        };
    }


    function dragstart() {
        _target = this;
        _event = eventOf(_target, arguments);

        var eventTarget = d3_event.target;
        var touchId = d3_event.touches ? d3_event.changedTouches[0].identifier : null;
        var offset;
        var startOrigin = point();
        var started = false;
        var selectEnable = d3_event_userSelectSuppress(touchId !== null ? 'drag-' + touchId : 'drag');

        d3_select(window)
            .on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', dragmove)
            .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', dragend, true);

        if (_origin) {
            offset = _origin.apply(_target, arguments);
            offset = [offset[0] - startOrigin[0], offset[1] - startOrigin[1]];
        } else {
            offset = [0, 0];
        }

        if (touchId === null) {
            d3_event.stopPropagation();
        }


        function point() {
            var p = _surface || _target.parentNode;
            return touchId !== null ? d3_touches(p).filter(function(p) {
                return p.identifier === touchId;
            })[0] : d3_mouse(p);
        }


        function dragmove() {
            var p = point();
            var dx = p[0] - startOrigin[0];
            var dy = p[1] - startOrigin[1];

            if (dx === 0 && dy === 0)
                return;

            startOrigin = p;
            d3_eventCancel();

            if (!started) {
                started = true;
                _event({ type: 'start' });
            } else {
                _event({
                    type: 'move',
                    point: [p[0] + offset[0],  p[1] + offset[1]],
                    delta: [dx, dy]
                });
            }
        }


        function dragend() {
            if (started) {
                _event({ type: 'end' });

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


    function behavior(selection) {
        var matchesSelector = utilPrefixDOMProperty('matchesSelector');
        var delegate = dragstart;

        if (_selector) {
            delegate = function() {
                var root = this;
                var target = d3_event.target;
                for (; target && target !== root; target = target.parentNode) {
                    var datum = target.__data__;

                    var entity = datum instanceof osmNote ?
                        datum : datum && datum.properties && datum.properties.entity;

                    if (entity && target[matchesSelector](_selector)) {
                        return dragstart.call(target, entity);
                    }
                }
            };
        }

        selection
            .on('mousedown.drag' + _selector, delegate)
            .on('touchstart.drag' + _selector, delegate);
    }


    behavior.off = function(selection) {
        selection
            .on('mousedown.drag' + _selector, null)
            .on('touchstart.drag' + _selector, null);
    };


    behavior.selector = function(_) {
        if (!arguments.length) return _selector;
        _selector = _;
        return behavior;
    };


    behavior.origin = function(_) {
        if (!arguments.length) return _origin;
        _origin = _;
        return behavior;
    };


    behavior.cancel = function() {
        d3_select(window)
            .on('mousemove.drag', null)
            .on('mouseup.drag', null);
        return behavior;
    };


    behavior.target = function() {
        if (!arguments.length) return _target;
        _target = arguments[0];
        _event = eventOf(_target, Array.prototype.slice.call(arguments, 1));
        return behavior;
    };


    behavior.surface = function() {
        if (!arguments.length) return _surface;
        _surface = arguments[0];
        return behavior;
    };


    return utilRebind(behavior, dispatch, 'on');
}
