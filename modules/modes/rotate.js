import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';

import {
    actionNoop,
    actionRotateWay
} from '../actions/index';

import { behaviorEdit } from '../behavior/index';

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
} from '../operations/index';


export function modeRotate(context, wayId) {
    var mode = {
        id: 'rotate',
        button: 'browse'
    };

    var keybinding = d3keybinding('rotate'),
        behaviors = [
            behaviorEdit(context),
            operationCircularize([wayId], context).behavior,
            operationDelete([wayId], context).behavior,
            operationMove([wayId], context).behavior,
            operationOrthogonalize([wayId], context).behavior,
            operationReflectLong([wayId], context).behavior,
            operationReflectShort([wayId], context).behavior
        ],
        prevGraph,
        prevAngle,
        pivot;


    mode.enter = function() {
        var way = context.graph().entity(wayId),
            nodes = _.uniq(context.graph().childNodes(way)),
            points = nodes.map(function(n) { return context.projection(n.loc); });

        pivot = d3.polygonCentroid(points);

        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        var annotation = t('operations.rotate.annotation.' + context.geometry(wayId));

        context.perform(actionNoop(), annotation);

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


        function doRotate() {
            var fn;
            if (prevGraph !== context.graph()) {
                fn = context.perform;
            } else {
                fn = context.replace;
            }

            var currMouse = context.mouse(),
                currAngle = Math.atan2(currMouse[1] - pivot[1], currMouse[0] - pivot[0]);

            if (typeof prevAngle === 'undefined') prevAngle = currAngle;
            var delta = currAngle - prevAngle;

            fn(actionRotateWay(wayId, pivot, delta, context.projection), annotation);
            prevAngle = currAngle;
            prevGraph = context.graph();
        }


        function finish() {
            d3.event.stopPropagation();
            context.enter(modeSelect(context, [wayId]).suppressMenu(true));
        }


        function cancel() {
            context.pop();
            context.enter(modeSelect(context, [wayId]).suppressMenu(true));
        }


        function undone() {
            context.enter(modeBrowse(context));
        }
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
