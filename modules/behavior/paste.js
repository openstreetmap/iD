import { actionCopyEntities } from '../actions/copy_entities';
import { actionMove } from '../actions/move';
import { geoExtent, geoPointInPolygon, geoVecSubtract } from '../geo';
import { modeMove } from '../modes/move';
import { uiCmd } from '../ui/cmd';

// see also `operationPaste`
export function behaviorPaste(context) {

    function doPaste(d3_event) {
        // prevent paste during low zoom selection
        if (!context.map().withinEditableZoom()) return;

        // prevent paste if the pasted object would be invisible (see #10000)
        const isOsmLayerEnabled = context.layers().layer('osm').enabled();
        if (!isOsmLayerEnabled) return;

        d3_event.preventDefault();

        const baseGraph = context.graph();
        const mouse = context.map().mouse();
        const projection = context.projection;
        const viewport = geoExtent(projection.clipExtent()).polygon();

        if (!geoPointInPolygon(mouse, viewport)) return;

        const oldIDs = context.copyIDs();
        if (!oldIDs.length) return;

        const extent = geoExtent();
        const oldGraph = context.copyGraph();
        const newIDs = [];

        const action = actionCopyEntities(oldIDs, oldGraph);
        context.perform(action);

        const copies = action.copies();
        const originals = new Set();
        Object.values(copies).forEach(function(entity) { originals.add(entity.id); });

        for (const id in copies) {
            const oldEntity = oldGraph.entity(id);
            const newEntity = copies[id];

            extent._extend(oldEntity.extent(oldGraph));

            // Exclude child nodes from newIDs if their parent way was also copied.
            const parents = context.graph().parentWays(newEntity);
            const parentCopied = parents.some(function(parent) {
                return originals.has(parent.id);
            });

            if (!parentCopied) {
                newIDs.push(newEntity.id);
            }
        }

        // Put pasted objects where mouse pointer is..
        const copyPoint = (context.copyLonLat() && projection(context.copyLonLat())) || projection(extent.center());
        const delta = geoVecSubtract(mouse, copyPoint);

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
