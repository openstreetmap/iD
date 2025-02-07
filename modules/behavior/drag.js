import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    selection as d3_selection
} from 'd3-selection';

import { osmNote } from '../osm';
import { utilRebind } from '../util/rebind';
import { utilFastMouse, utilPrefixCSSProperty, utilPrefixDOMProperty } from '../util';


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
    var _targetNode;
    var _targetEntity;
    var _surface;
    var _pointerId;

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

    var d3_event_userSelectProperty = utilPrefixCSSProperty('UserSelect');
    var d3_event_userSelectSuppress = function() {
            var selection = d3_selection();
            var select = selection.style(d3_event_userSelectProperty);
            selection.style(d3_event_userSelectProperty, 'none');
            return function() {
                selection.style(d3_event_userSelectProperty, select);
            };
        };


    function pointerdown(d3_event) {
        if (_pointerId) return;

        // Explicitly handle touch events for mobile
        if (d3_event.type === 'touchstart') {
            // Ignore multi-touch scenarios
            if (d3_event.touches.length > 1) return;
            // Use the first touch point
            d3_event = d3_event.touches[0];
        }

        _pointerId = d3_event.pointerId || 'touch';
        _targetNode = this;

        // only force reflow once per drag
        var pointerLocGetter = utilFastMouse(_surface || _targetNode.parentNode);

        var offset;
        var startOrigin = pointerLocGetter(d3_event);
        var started = false;
        var selectEnable = d3_event_userSelectSuppress();

        // Track initial position to determine intentional drag
        var initialPosition = {
            x: d3_event.clientX,
            y: d3_event.clientY
        };

        // Add touch event listeners for mobile
        var moveEvent = d3_event.type === 'touchstart' ? 'touchmove' : (_pointerPrefix + 'move.drag');
        var upEvent = d3_event.type === 'touchstart' ? 'touchend' : (_pointerPrefix + 'up.drag pointercancel.drag');

        d3_select(window)
            .on(moveEvent + '.drag', pointermove)
            .on(upEvent + '.drag', pointerup, true);

        if (_origin) {
            offset = _origin.call(_targetNode, _targetEntity);
            offset = [offset[0] - startOrigin[0], offset[1] - startOrigin[1]];
        } else {
            offset = [0, 0];
        }

        d3_event.stopPropagation();

        function pointermove(d3_event) {
            // Handle touch events for mobile
            if (d3_event.type === 'touchmove') {
                // Ignore multi-touch scenarios
                if (d3_event.touches.length > 1) return;
                // Use the first touch point
                d3_event = d3_event.touches[0];
            }

            if (_pointerId !== (d3_event.pointerId || 'touch')) return;

            var p = pointerLocGetter(d3_event);

            // Determine if this is an intentional drag
            var currentPosition = {
                x: d3_event.clientX,
                y: d3_event.clientY
            };

            var dragDistance = Math.sqrt(
                Math.pow(currentPosition.x - initialPosition.x, 2) +
                Math.pow(currentPosition.y - initialPosition.y, 2)
            );

            // Only start drag after minimal movement
            if (!started && dragDistance > 5) {
                started = true;
                dispatch.call('start', this, d3_event, _targetEntity);
            }

            if (started) {
                // Precise delta calculation
                var delta = [
                    p[0] - startOrigin[0] - offset[0],
                    p[1] - startOrigin[1] - offset[1]
                ];

                dispatch.call('move', this, d3_event, _targetEntity, [
                    p[0] - offset[0],
                    p[1] - offset[1]
                ], delta);
            }
        }

        function pointerup(d3_event) {
            // Handle touch events for mobile
            if (d3_event.type === 'touchend') {
                // Use the first touch point
                d3_event = d3_event.changedTouches[0];
            }

            if (_pointerId !== (d3_event.pointerId || 'touch')) return;

            selectEnable();

            d3_select(window)
                .on(_pointerPrefix + 'move.drag', null)
                .on(_pointerPrefix + 'up.drag pointercancel.drag', null);

            if (started) {
                dispatch.call('end', this, d3_event, _targetEntity);
            }

            _pointerId = null;
        }
    }


    function behavior(selection) {
        var matchesSelector = utilPrefixDOMProperty('matchesSelector');
        var delegate = pointerdown;

        if (_selector) {
            delegate = function(d3_event) {
                var root = this;
                var target = d3_event.target;
                for (; target && target !== root; target = target.parentNode) {
                    var datum = target.__data__;

                    _targetEntity = datum instanceof osmNote ? datum
                        : datum && datum.properties && datum.properties.entity;

                    if (_targetEntity && target[matchesSelector](_selector)) {
                        return pointerdown.call(target, d3_event);
                    }
                }
            };
        }

        selection
            .on(_pointerPrefix + 'down.drag' + _selector, delegate);
    }


    behavior.off = function(selection) {
        selection
            .on(_pointerPrefix + 'down.drag' + _selector, null);
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
            .on(_pointerPrefix + 'move.drag', null)
            .on(_pointerPrefix + 'up.drag pointercancel.drag', null);
        return behavior;
    };


    behavior.targetNode = function(_) {
        if (!arguments.length) return _targetNode;
        _targetNode = _;
        return behavior;
    };


    behavior.targetEntity = function(_) {
        if (!arguments.length) return _targetEntity;
        _targetEntity = _;
        return behavior;
    };


    behavior.surface = function(_) {
        if (!arguments.length) return _surface;
        _surface = _;
        return behavior;
    };


    return utilRebind(behavior, dispatch, 'on');
}
