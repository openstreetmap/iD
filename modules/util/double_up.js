import { dispatch as d3_dispatch } from 'd3-dispatch';
import { mouse as d3_mouse } from 'd3-selection';

import { utilRebind } from './rebind';
import { geoVecLength } from '../geo/vector';

// a double-click / double-tap event detector with wider
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
        // d3_mouse works since pointer events inherit from mouse events
        var loc = d3_mouse(this);

        if (_pointer && !pointerIsValidFor(loc)) {
            // if this pointer is no longer valid, clear it so another can be started
            _pointer = undefined;
        }
        if (!_pointer) {
            // don't rely on the pointerId since it can change between down events on touch devices
            _pointer = {
                startLoc: loc,
                startTime: new Date().getTime(),
                upCount: 0
            };
        }
    }

    function pointerup() {
        if (!_pointer) return;

        _pointer.upCount += 1;

        if (_pointer.upCount === 2) { // double up!
            var loc = d3_mouse(this);
            if (pointerIsValidFor(loc)) {
                dispatch.call('doubleUp', this, loc);
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
                    dispatch.call('doubleUp', this, d3_mouse(this));
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
