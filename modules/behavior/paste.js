import _invert from 'lodash-es/invert';
import _mapValues from 'lodash-es/mapValues';

import { event as d3_event } from 'd3-selection';

import { actionCopyEntities, actionMove } from '../actions';
import { geoExtent, geoPointInPolygon, geoVecSubtract } from '../geo';
import { modeMove } from '../modes';
import { uiCmd } from '../ui';


export function behaviorPaste(context) {

    function doPaste() {
        d3_event.preventDefault();

        var baseGraph = context.graph();
        var mouse = context.mouse();
        var projection = context.projection;
        var viewport = geoExtent(projection.clipExtent()).polygon();

        if (!geoPointInPolygon(mouse, viewport)) return;

        var extent = geoExtent();
        var oldIDs = context.copyIDs();
        var oldGraph = context.copyGraph();
        var newIDs = [];

        if (!oldIDs.length) return;

        var action = actionCopyEntities(oldIDs, oldGraph);
        context.perform(action);

        var copies = action.copies();
        var originals = _invert(_mapValues(copies, 'id'));
        for (var id in copies) {
            var oldEntity = oldGraph.entity(id);
            var newEntity = copies[id];

            extent._extend(oldEntity.extent(oldGraph));

            // Exclude child nodes from newIDs if their parent way was also copied.
            var parents = context.graph().parentWays(newEntity);
            var parentCopied = false;
            for (var i = 0; i < parents.length; i++) {
                if (originals[parents[i].id]) {
                    parentCopied = true;
                    break;
                }
            }

            if (!parentCopied) {
                newIDs.push(newEntity.id);
            }
        }

        // Put pasted objects where mouse pointer is..
        var center = projection(extent.center());
        var delta = geoVecSubtract(mouse, center);

        context.perform(actionMove(newIDs, delta, projection));
        context.enter(modeMove(context, newIDs, baseGraph));
    }


    function behavior() {
        context.keybinding().on(uiCmd('⌘V'), doPaste);
        return behavior;
    }


    behavior.off = function() {
        context.keybinding().off(uiCmd('⌘V'));
    };


    return behavior;
}
