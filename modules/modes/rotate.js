import {
    select as d3_select
} from 'd3-selection';

import {
    polygonHull as d3_polygonHull,
    polygonCentroid as d3_polygonCentroid
} from 'd3-polygon';

import { t } from '../core/localizer';
import { actionRotate } from '../actions/rotate';
import { actionRotatePointDirection } from '../actions/rotate_point_direction';
import { actionNoop } from '../actions/noop';
import { behaviorEdit } from '../behavior/edit';
import { geoVecInterp, geoVecLength } from '../geo/vector';
import { modeBrowse } from './browse';
import { modeSelect } from './select';

import { operationCircularize } from '../operations/circularize';
import { operationDelete } from '../operations/delete';
import { operationMove } from '../operations/move';
import { operationOrthogonalize } from '../operations/orthogonalize';
import { operationReflectLong, operationReflectShort } from '../operations/reflect';

import { utilSelectedRotatePointDirectionKey } from '../util/direction_field';
import { utilKeybinding } from '../util/keybinding';
import { utilWrap } from '../util';
import { utilFastMouse, utilGetAllNodes } from '../util/util';


export function modeRotate(context, entityIDs) {

    var _tolerancePx = 4; // see also behaviorDrag, behaviorSelect, modeMove

    var mode = {
        id: 'rotate',
        button: 'browse'
    };

    var keybinding = utilKeybinding('rotate');
    var behaviors = [
        behaviorEdit(context),
        operationCircularize(context, entityIDs).behavior,
        operationDelete(context, entityIDs).behavior,
        operationMove(context, entityIDs).behavior,
        operationOrthogonalize(context, entityIDs).behavior,
        operationReflectLong(context, entityIDs).behavior,
        operationReflectShort(context, entityIDs).behavior
    ];
    var annotation = entityIDs.length === 1 ?
        t('operations.rotate.annotation.' + context.graph().geometry(entityIDs[0])) :
        t('operations.rotate.annotation.feature', { n: entityIDs.length });

    var _prevGraph;
    var _prevAngle;
    var _prevTransform;
    var _pivot;
    let _pointDirectionKey = false;

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';


    function doRotate(d3_event) {
        var fn;
        if (context.graph() !== _prevGraph) {
            fn = context.perform;
        } else {
            fn = context.replace;
        }

        // projection changed, recalculate _pivot
        var projection = context.projection;
        var currTransform = projection.transform();
        const transformChanged = !_prevTransform ||
            currTransform.k !== _prevTransform.k ||
            currTransform.x !== _prevTransform.x ||
            currTransform.y !== _prevTransform.y;
        if (transformChanged) {
            var nodes = utilGetAllNodes(entityIDs, context.graph());
            var points = nodes.map(function(n) { return projection(n.loc); });
            _pivot = getPivot(points);
            _prevAngle = undefined;
        }


        var currMouse = context.map().mouse(d3_event);

        if (_pointDirectionKey) {
            // Skip the first move after pan/zoom so the direction does not jump
            // (geometry rotate does the same via a zero delta).
            if (!transformChanged) {
                // Point the direction at the mouse: OSM azimuth 0 = north, clockwise.
                const dx = currMouse[0] - _pivot[0];
                const dy = currMouse[1] - _pivot[1];
                const absoluteDegrees = utilWrap(Math.atan2(dx, -dy) * (180 / Math.PI), 360);
                fn(actionRotatePointDirection(entityIDs[0], absoluteDegrees, _pointDirectionKey));
            }
        } else {
            const currAngle = Math.atan2(currMouse[1] - _pivot[1], currMouse[0] - _pivot[0]);
            if (typeof _prevAngle === 'undefined') _prevAngle = currAngle;
            const delta = currAngle - _prevAngle;
            fn(actionRotate(entityIDs, _pivot, delta, projection));
            _prevAngle = currAngle;
        }

        _prevTransform = currTransform;
        _prevGraph = context.graph();
    }

    function getPivot(points) {
        var _pivot;
        if (points.length === 1) {
            _pivot = points[0];
        } else if (points.length === 2) {
            _pivot = geoVecInterp(points[0], points[1], 0.5);
        } else {
            var polygonHull = d3_polygonHull(points);
            if (polygonHull.length === 2) {
                _pivot = geoVecInterp(points[0], points[1], 0.5);
            } else {
                _pivot = d3_polygonCentroid(d3_polygonHull(points));
            }
        }
        return _pivot;
    }


    function finish(d3_event) {
        d3_event.stopPropagation();
        context.replace(actionNoop(), annotation);
        context.enter(modeSelect(context, entityIDs));
    }


    function cancel() {
        if (_prevGraph) context.pop();   // remove the rotate
        context.enter(modeSelect(context, entityIDs));
    }


    function undone() {
        context.enter(modeBrowse(context));
    }


    mode.enter = function() {
        _prevGraph = null;
        _pointDirectionKey = utilSelectedRotatePointDirectionKey(entityIDs, context.graph());
        context.features().forceVisible(entityIDs);

        behaviors.forEach(context.install);

        var downEvent;

        context.surface()
            .on(_pointerPrefix + 'down.modeRotate', function(d3_event) {
                downEvent = d3_event;
            });

        d3_select(window)
            .on(_pointerPrefix + 'move.modeRotate', doRotate, true)
            .on(_pointerPrefix + 'up.modeRotate', function(d3_event) {
                if (!downEvent) return;
                var mapNode = context.container().select('.main-map').node();
                var pointGetter = utilFastMouse(mapNode);
                var p1 = pointGetter(downEvent);
                var p2 = pointGetter(d3_event);
                var dist = geoVecLength(p1, p2);

                if (dist <= _tolerancePx) finish(d3_event);
                downEvent = null;
            }, true);

        context.history()
            .on('undone.modeRotate', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3_select(document)
            .call(keybinding);
    };


    mode.exit = function(nextMode) {
        behaviors.forEach(context.uninstall);

        context.surface()
            .on(_pointerPrefix + 'down.modeRotate', null);

        d3_select(window)
            .on(_pointerPrefix + 'move.modeRotate', null, true)
            .on(_pointerPrefix + 'up.modeRotate', null, true);

        context.history()
            .on('undone.modeRotate', null);

        d3_select(document)
            .call(keybinding.unbind);

        // select.enter will refresh the editor; hide only when leaving selection
        // entirely (e.g. undo → browse).
        if (!nextMode || nextMode.id !== 'select') {
            context.ui().sidebar.hide();
        }
        context.features().forceVisible([]);
    };


    mode.selectedIDs = function() {
        if (!arguments.length) return entityIDs;
        // no assign
        return mode;
    };


    return mode;
}
