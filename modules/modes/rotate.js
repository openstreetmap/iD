import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import {
    polygonHull as d3_polygonHull,
    polygonCentroid as d3_polygonCentroid
} from 'd3-polygon';

import { t } from '../util/locale';
import { actionRotate } from '../actions';
import { behaviorEdit } from '../behavior';
import { geoVecInterp } from '../geo';
import { modeBrowse, modeSelect } from './index';

import {
    operationCircularize,
    operationDelete,
    operationMove,
    operationOrthogonalize,
    operationReflectLong,
    operationReflectShort
} from '../operations';

import { utilGetAllNodes, utilKeybinding } from '../util';


export function modeRotate(context, entityIDs) {
    var mode = {
        id: 'rotate',
        button: 'browse'
    };

    var keybinding = utilKeybinding('rotate');
    var behaviors = [
        behaviorEdit(context),
        operationCircularize(entityIDs, context).behavior,
        operationDelete(entityIDs, context).behavior,
        operationMove(entityIDs, context).behavior,
        operationOrthogonalize(entityIDs, context).behavior,
        operationReflectLong(entityIDs, context).behavior,
        operationReflectShort(entityIDs, context).behavior
    ];
    var annotation = entityIDs.length === 1 ?
        t('operations.rotate.annotation.' + context.geometry(entityIDs[0])) :
        t('operations.rotate.annotation.multiple');

    var _prevGraph;
    var _prevAngle;
    var _prevTransform;
    var _pivot;


    function doRotate() {
        var fn;
        if (context.graph() !== _prevGraph) {
            fn = context.perform;
        } else {
            fn = context.replace;
        }

        // projection changed, recalculate _pivot
        var projection = context.projection;
        var currTransform = projection.transform();
        if (!_prevTransform ||
            currTransform.k !== _prevTransform.k ||
            currTransform.x !== _prevTransform.x ||
            currTransform.y !== _prevTransform.y) {

            var nodes = utilGetAllNodes(entityIDs, context.graph());
            var points = nodes.map(function(n) { return projection(n.loc); });

            if (points.length === 1) {  // degenerate case
                _pivot = points[0];
            } else if (points.length === 2) {
                _pivot = geoVecInterp(points[0], points[1], 0.5);
            } else {
                _pivot = d3_polygonCentroid(d3_polygonHull(points));
            }
            _prevAngle = undefined;
        }


        var currMouse = context.mouse();
        var currAngle = Math.atan2(currMouse[1] - _pivot[1], currMouse[0] - _pivot[0]);

        if (typeof _prevAngle === 'undefined') _prevAngle = currAngle;
        var delta = currAngle - _prevAngle;

        fn(actionRotate(entityIDs, _pivot, delta, projection), annotation);

        _prevTransform = currTransform;
        _prevAngle = currAngle;
        _prevGraph = context.graph();
    }


    function finish() {
        d3_event.stopPropagation();
        context.enter(modeSelect(context, entityIDs));
    }


    function cancel() {
        context.pop();
        context.enter(modeSelect(context, entityIDs));
    }


    function undone() {
        context.enter(modeBrowse(context));
    }


    mode.enter = function() {
        behaviors.forEach(context.install);

        context.surface()
            .on('mousemove.rotate', doRotate)
            .on('click.rotate', finish);

        context.history()
            .on('undone.rotate', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3_select(document)
            .call(keybinding);
    };


    mode.exit = function() {
        behaviors.forEach(context.uninstall);

        context.surface()
            .on('mousemove.rotate', null)
            .on('click.rotate', null);

        context.history()
            .on('undone.rotate', null);

        d3_select(document)
            .call(keybinding.unbind);
    };


    mode.selectedIDs = function() {
        if (!arguments.length) return entityIDs;
        // no assign
        return mode;
    };


    return mode;
}
