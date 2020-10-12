import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    customEvent as d3_customEvent,
    event as d3_event,
    select as d3_select,
    selection as d3_selection
} from 'd3-selection';

import { geoVecLength } from '../geo';
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

    // see also behaviorSelect
    var _tolerancePx = 1; // keep this low to facilitate pixel-perfect micromapping
    var _penTolerancePx = 4; // styluses can be touchy so require greater movement - #1981

    var _origin = null;
    var _selector = '';
    var _event;
    var _target;
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


    function eventOf(thiz, argumentz) {
        return function(e1) {
            e1.target = behavior;
            d3_customEvent(e1, dispatch.apply, dispatch, [e1.type, thiz, argumentz]);
        };
    }


    function pointerdown() {

        if (_pointerId) return;

        _pointerId = d3_event.pointerId || 'mouse';

        _target = this;
        _event = eventOf(_target, arguments);

        // only force reflow once per drag
        var pointerLocGetter = utilFastMouse(_surface || _target.parentNode);

        var offset;
        var startOrigin = pointerLocGetter(d3_event);
        var started = false;
        var selectEnable = d3_event_userSelectSuppress();

        d3_select(window)
            .on(_pointerPrefix + 'move.drag', pointermove)
            .on(_pointerPrefix + 'up.drag pointercancel.drag', pointerup, true);

        if (_origin) {
            offset = _origin.apply(_target, arguments);
            offset = [offset[0] - startOrigin[0], offset[1] - startOrigin[1]];
        } else {
            offset = [0, 0];
        }

        d3_event.stopPropagation();


        function pointermove() {
            if (_pointerId !== (d3_event.pointerId || 'mouse')) return;

            var p = pointerLocGetter(d3_event);

            if (!started) {
                var dist = geoVecLength(startOrigin,  p);
                var tolerance = d3_event.pointerType === 'pen' ? _penTolerancePx : _tolerancePx;
                // don't start until the drag has actually moved somewhat
                if (dist < tolerance) return;

                started = true;
                _event({ type: 'start' });

            // Don't send a `move` event in the same cycle as `start` since dragging
            // a midpoint will convert the target to a node.
            } else {

                startOrigin = p;
                d3_event.stopPropagation();
                d3_event.preventDefault();

                var dx = p[0] - startOrigin[0];
                var dy = p[1] - startOrigin[1];
                _event({
                    type: 'move',
                    point: [p[0] + offset[0],  p[1] + offset[1]],
                    delta: [dx, dy]
                });
            }
        }


        function pointerup() {
            if (_pointerId !== (d3_event.pointerId || 'mouse')) return;

            _pointerId = null;

            if (started) {
                _event({ type: 'end' });

                d3_event.preventDefault();
            }

            d3_select(window)
                .on(_pointerPrefix + 'move.drag', null)
                .on(_pointerPrefix + 'up.drag pointercancel.drag', null);

            selectEnable();
        }
    }


    function behavior(selection) {
        var matchesSelector = utilPrefixDOMProperty('matchesSelector');
        var delegate = pointerdown;

        if (_selector) {
            delegate = function() {
                var root = this;
                var target = d3_event.target;
                for (; target && target !== root; target = target.parentNode) {
                    var datum = target.__data__;

                    var entity = datum instanceof osmNote ? datum
                        : datum && datum.properties && datum.properties.entity;

                    if (entity && target[matchesSelector](_selector)) {
                        return pointerdown.call(target, entity);
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
