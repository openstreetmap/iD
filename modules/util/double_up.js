import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event } from 'd3-selection';

import { utilFastMouse } from './util';
import { utilRebind } from './rebind';
import { geoVecLength } from '../geo/vector';

// A custom double-click / double-tap event detector that works on touch devices
// if pointer events are supported. Falls back to default `dblclick` event.
export function utilDoubleUp() {

    var dispatch = d3_dispatch('doubleUp');

    var _maxTimespan = 500; // milliseconds
    var _maxDistance = 20; // web pixels; be somewhat generous to account for touch devices
    var _pointer; // object representing the pointer that could trigger double up

    function pointerIsValidFor(loc) {
        // second pointerup must occur within a small timeframe after the first pointerdown
        return new Date().getTime() - _pointer.startTime <= _maxTimespan &&
            // all pointer events must occur within a small distance of the first pointerdown
            geoVecLength(_pointer.startLoc, loc) <= _maxDistance;
    }

    function pointerdown() {

        // ignore right-click
        if (d3_event.ctrlKey || d3_event.button === 2) return;

        var loc = [d3_event.clientX, d3_event.clientY];

        // Don't rely on pointerId here since it can change between pointerdown
        // events on touch devices
        if (_pointer && !pointerIsValidFor(loc)) {
            // if this pointer is no longer valid, clear it so another can be started
            _pointer = undefined;
        }

        if (!_pointer) {
            _pointer = {
                startLoc: loc,
                startTime: new Date().getTime(),
                upCount: 0,
                pointerId: d3_event.pointerId
            };
        } else { // double down
            _pointer.pointerId = d3_event.pointerId;
        }
    }

    function pointerup() {

        // ignore right-click
        if (d3_event.ctrlKey || d3_event.button === 2) return;

        if (!_pointer || _pointer.pointerId !== d3_event.pointerId) return;

        _pointer.upCount += 1;

        if (_pointer.upCount === 2) { // double up!
            var loc = [d3_event.clientX, d3_event.clientY];
            if (pointerIsValidFor(loc)) {
                var locInThis = utilFastMouse(this)(d3_event);
                dispatch.call('doubleUp', this, locInThis);
            }
            // clear the pointer info in any case
            _pointer = undefined;
        }
    }

    function doubleUp(selection) {
        if ('PointerEvent' in window) {
            // dblclick isn't well supported on touch devices so manually use
            // pointer events if they're available
            selection
                .on('pointerdown.doubleUp', pointerdown)
                .on('pointerup.doubleUp', pointerup);
        } else {
            // fallback to dblclick
            selection
                .on('dblclick.doubleUp', function() {
                    dispatch.call('doubleUp', this, utilFastMouse(this)(d3_event));
                });
        }
    }

    doubleUp.off = function(selection) {
        selection
            .on('pointerdown.doubleUp', null)
            .on('pointerup.doubleUp', null)
            .on('dblclick.doubleUp', null);
    };

    return utilRebind(doubleUp, dispatch, 'on');
}
