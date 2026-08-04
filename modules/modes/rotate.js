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

import { utilKeybinding } from '../util/keybinding';
import { utilFastMouse, utilGetAllNodes } from '../util/util';


export function modeRotate(context, entityIDs) {

    const _tolerancePx = 4; // see also behaviorDrag, behaviorSelect, modeMove

    const mode = {
        id: 'rotate',
        button: 'browse'
    };

    const keybinding = utilKeybinding('rotate');
    const behaviors = [
        behaviorEdit(context),
        operationCircularize(context, entityIDs).behavior,
        operationDelete(context, entityIDs).behavior,
        operationMove(context, entityIDs).behavior,
        operationOrthogonalize(context, entityIDs).behavior,
        operationReflectLong(context, entityIDs).behavior,
        operationReflectShort(context, entityIDs).behavior
    ];
    const annotation = entityIDs.length === 1 ?
        t('operations.rotate.annotation.' + context.graph().geometry(entityIDs[0])) :
        t('operations.rotate.annotation.feature', { n: entityIDs.length });

    let _prevGraph;
    let _prevAngle;
    let _prevTransform;
    let _pivot;
    let _pointDirectionRotate = false;

    // use pointer events on supported platforms; fallback to mouse events
    const _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';


    function doRotate(d3_event) {
        const fn = (context.graph() !== _prevGraph) ? context.perform : context.replace;

        // projection changed, recalculate _pivot
        const projection = context.projection;
        const currTransform = projection.transform();
        if (!_prevTransform ||
            currTransform.k !== _prevTransform.k ||
            currTransform.x !== _prevTransform.x ||
            currTransform.y !== _prevTransform.y) {

            const nodes = utilGetAllNodes(entityIDs, context.graph());
            const points = nodes.map(function(n) { return projection(n.loc); });
            _pivot = getPivot(points);
            _prevAngle = undefined;
        }


        const currMouse = context.map().mouse(d3_event);
        const currAngle = Math.atan2(currMouse[1] - _pivot[1], currMouse[0] - _pivot[0]);

        if (typeof _prevAngle === 'undefined') _prevAngle = currAngle;
        const delta = currAngle - _prevAngle;

        if (_pointDirectionRotate) {
            const deltaDegrees = delta * (180 / Math.PI);
            fn(actionRotatePointDirection(entityIDs[0], deltaDegrees));
        } else {
            fn(actionRotate(entityIDs, _pivot, delta, projection));
        }

        _prevTransform = currTransform;
        _prevAngle = currAngle;
        _prevGraph = context.graph();
    }

    function getPivot(points) {
        if (points.length === 1) {
            return points[0];
        }
        if (points.length === 2) {
            return geoVecInterp(points[0], points[1], 0.5);
        }

        const polygonHull = d3_polygonHull(points);
        if (!polygonHull || polygonHull.length <= 2) {
            return geoVecInterp(points[0], points[1], 0.5);
        }

        return d3_polygonCentroid(polygonHull);
    }


    function isPointDirectionRotate(graph) {
        if (entityIDs.length !== 1) return false;

        const entity = graph.hasEntity(entityIDs[0]);
        if (!entity || entity.type !== 'node') return false;
        if (graph.geometry(entity.id) !== 'point') return false;

        const direction = Number(entity.tags.direction);
        return isFinite(direction);
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
        _pointDirectionRotate = isPointDirectionRotate(context.graph());
        context.features().forceVisible(entityIDs);

        behaviors.forEach(context.install);

        let downEvent;

        context.surface()
            .on(_pointerPrefix + 'down.modeRotate', function(d3_event) {
                downEvent = d3_event;
            });

        d3_select(window)
            .on(_pointerPrefix + 'move.modeRotate', doRotate, true)
            .on(_pointerPrefix + 'up.modeRotate', function(d3_event) {
                if (!downEvent) return;
                const mapNode = context.container().select('.main-map').node();
                const pointGetter = utilFastMouse(mapNode);
                const p1 = pointGetter(downEvent);
                const p2 = pointGetter(d3_event);
                const dist = geoVecLength(p1, p2);

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
