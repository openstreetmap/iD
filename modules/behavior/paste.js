import { event as d3_event } from 'd3-selection';

import { actionCopyEntities } from '../actions/copy_entities';
import { actionMove } from '../actions/move';
import { geoExtent, geoPointInPolygon, geoVecSubtract } from '../geo';
import { modeMove } from '../modes/move';
import { uiCmd } from '../ui/cmd';

// see also `operationPaste`
export function behaviorPaste(context) {

    function doPaste() {
        // prevent paste during low zoom selection
        if (!context.map().withinEditableZoom()) return;

        d3_event.preventDefault();

        var baseGraph = context.graph();
        var mouse = context.map().mouse();
        var projection = context.projection;
        var viewport = geoExtent(projection.clipExtent()).polygon();

        if (!geoPointInPolygon(mouse, viewport)) return;

        var oldIDs = context.copyIDs();
        if (!oldIDs.length) return;

        var extent = geoExtent();
        var oldGraph = context.copyGraph();
        var newIDs = [];

        var action = actionCopyEntities(oldIDs, oldGraph);
        context.perform(action);

        var copies = action.copies();
        var originals = new Set();
        Object.values(copies).forEach(function(entity) { originals.add(entity.id); });

        for (var id in copies) {
            var oldEntity = oldGraph.entity(id);
            var newEntity = copies[id];

            extent._extend(oldEntity.extent(oldGraph));

            // Exclude child nodes from newIDs if their parent way was also copied.
            var parents = context.graph().parentWays(newEntity);
            var parentCopied = parents.some(function(parent) {
                return originals.has(parent.id);
            });

            if (!parentCopied) {
                newIDs.push(newEntity.id);
            }
        }

        // Put pasted objects where mouse pointer is..
        var copyPoint = (context.copyLonLat() && projection(context.copyLonLat())) || projection(extent.center());
        var delta = geoVecSubtract(mouse, copyPoint);

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
