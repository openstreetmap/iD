import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { actionRotate } from '../actions';
import { behaviorEdit } from '../behavior';
import { geoInterp } from '../geo';
import {
    modeBrowse,
    modeSelect
} from './index';

import {
    operationCircularize,
    operationDelete,
    operationMove,
    operationOrthogonalize,
    operationReflectLong,
    operationReflectShort
} from '../operations';

import {
    polygonHull as d3polygonHull,
    polygonCentroid as d3polygonCentroid
} from 'd3';

import { utilGetAllNodes } from '../util';


export function modeRotate(context, entityIDs) {
    var mode = {
        id: 'rotate',
        button: 'browse'
    };

    var keybinding = d3keybinding('rotate'),
        behaviors = [
            behaviorEdit(context),
            operationCircularize(entityIDs, context).behavior,
            operationDelete(entityIDs, context).behavior,
            operationMove(entityIDs, context).behavior,
            operationOrthogonalize(entityIDs, context).behavior,
            operationReflectLong(entityIDs, context).behavior,
            operationReflectShort(entityIDs, context).behavior
        ],
        annotation = entityIDs.length === 1 ?
            t('operations.rotate.annotation.' + context.geometry(entityIDs[0])) :
            t('operations.rotate.annotation.multiple'),
        prevGraph,
        prevAngle,
        prevTransform,
        pivot;


    function doRotate() {
        var fn;
        if (context.graph() !== prevGraph) {
            fn = context.perform;
        } else {
            fn = context.replace;
        }

        // projection changed, recalculate pivot
        var projection = context.projection;
        var currTransform = projection.transform();
        if (!prevTransform ||
            currTransform.k !== prevTransform.k ||
            currTransform.x !== prevTransform.x ||
            currTransform.y !== prevTransform.y) {

            var nodes = utilGetAllNodes(entityIDs, context.graph()),
                points = nodes.map(function(n) { return projection(n.loc); });

            if (points.length === 1) {  // degenerate case
                pivot = points[0];
            } else if (points.length === 2) {
                pivot = geoInterp(points[0], points[1], 0.5);
            } else {
                pivot = d3polygonCentroid(d3polygonHull(points));
            }
            prevAngle = undefined;
        }


        var currMouse = context.mouse(),
            currAngle = Math.atan2(currMouse[1] - pivot[1], currMouse[0] - pivot[0]);

        if (typeof prevAngle === 'undefined') prevAngle = currAngle;
        var delta = currAngle - prevAngle;

        fn(actionRotate(entityIDs, pivot, delta, projection), annotation);

        prevTransform = currTransform;
        prevAngle = currAngle;
        prevGraph = context.graph();
    }


    function finish() {
        d3.event.stopPropagation();
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
        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        context.surface()
            .on('mousemove.rotate', doRotate)
            .on('click.rotate', finish);

        context.history()
            .on('undone.rotate', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };


    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        context.surface()
            .on('mousemove.rotate', null)
            .on('click.rotate', null);

        context.history()
            .on('undone.rotate', null);

        keybinding.off();
    };


    return mode;
}
