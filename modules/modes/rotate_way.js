import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { modeBrowse, modeSelect } from './index';
import { actionNoop, actionRotateWay } from '../actions/index';
import { behaviorEdit } from '../behavior/index';


export function modeRotateWay(context, wayId) {
    var mode = {
        id: 'rotate-way',
        button: 'browse'
    };

    var keybinding = d3keybinding('rotate-way'),
        edit = behaviorEdit(context);


    mode.enter = function() {
        context.install(edit);

        var annotation = t('operations.rotate.annotation.' + context.geometry(wayId)),
            way = context.graph().entity(wayId),
            nodes = _.uniq(context.graph().childNodes(way)),
            points = nodes.map(function(n) { return context.projection(n.loc); }),
            pivot = d3.polygonCentroid(points),
            angle;

        context.perform(
            actionNoop(),
            annotation
        );

        context.surface()
            .on('mousemove.rotate-way', rotate)
            .on('click.rotate-way', finish);

        context.history()
            .on('undone.rotate-way', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);


        function rotate() {
            var mousePoint = context.mouse(),
                newAngle = Math.atan2(mousePoint[1] - pivot[1], mousePoint[0] - pivot[0]);

            if (typeof angle === 'undefined') angle = newAngle;

            context.replace(
                actionRotateWay(wayId, pivot, newAngle - angle, context.projection),
                annotation
            );

            angle = newAngle;
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
        context.uninstall(edit);

        context.surface()
            .on('mousemove.rotate-way', null)
            .on('click.rotate-way', null);

        context.history()
            .on('undone.rotate-way', null);

        keybinding.off();
    };


    return mode;
}
