import { select as d3_select } from 'd3-selection';

import { actionAddEntity } from '../actions/add_entity';
import { actionCopyEntities } from '../actions/copy_entities';
import { actionMove } from '../actions/move';
import { geoExtent, geoPointInPolygon, geoVecSubtract } from '../geo';
import { modeMove } from '../modes/move';
import { modeSelect } from '../modes/select';
import { operationPaste } from '../operations';
import { osmNode } from '../osm/node';
import { t } from '../core/localizer';
import { uiCmd } from '../ui/cmd';
import { utilGeojsonPoints } from '../util';

// see also `operationPaste`. Without features copied in iD, the browser pastes the clipboard: GeoJSON points
// copied from another tool (e.g. addresses to add) are added as nodes with their properties as tags.
export function behaviorPaste(context) {

    function flashNothingCopied() {
        context.ui().flash
            .duration(4000)
            .iconName('#iD-icon-no')
            .iconClass('disabled')
            .label(t.append('operations.paste.nothing_copied'))();
    }


    // Whether a pasted feature would be editable and visible, as checked by `doPaste`
    function canPaste() {
        return context.map().withinEditableZoom() && context.layers().layer('osm').enabled();
    }

    function doPaste(d3_event) {
        // prevent paste during low zoom selection
        if (!context.map().withinEditableZoom()) return;

        // prevent paste if the pasted object would be invisible (see #10000)
        const isOsmLayerEnabled = context.layers().layer('osm').enabled();
        if (!isOsmLayerEnabled) return;

        // Nothing copied in iD: the browser pastes the clipboard, see `pasteGeojson`
        if (!context.copyIDs().length) return;

        d3_event.preventDefault();

        var baseGraph = context.graph();
        var mouse = context.map().mouse();
        var projection = context.projection;
        var viewport = geoExtent(projection.clipExtent()).polygon();

        if (!geoPointInPolygon(mouse, viewport)) return;

        var oldIDs = context.copyIDs();
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
        context.enter(modeMove(context, newIDs, baseGraph)
            .annotation(operationPaste(context).annotation()));
    }


    // Add the GeoJSON points of the clipboard as nodes at their position, and select them
    function pasteGeojson(d3_event) {
        // A text field gets the pasted text
        if (d3_event.target.closest?.('input, textarea, [contenteditable]')) return;
        if (!canPaste() || context.copyIDs().length) return;

        var points = utilGeojsonPoints(d3_event.clipboardData?.getData('text/plain') ?? '');
        if (!points.length) {
            flashNothingCopied();
            return;
        }
        d3_event.preventDefault();

        var nodes = points.map(function(point) {
            return new osmNode({ loc: point.loc, tags: point.tags });
        });
        context.perform(
            function(graph) {
                return nodes.reduce(function(result, node) { return actionAddEntity(node)(result); }, graph);
            },
            t('operations.paste.annotation', { n: nodes.length })
        );
        context.enter(modeSelect(context, nodes.map(function(node) { return node.id; })));
    }


    function behavior() {
        context.keybinding().on(uiCmd('⌘V'), doPaste);
        d3_select(document).on('paste.behaviorPaste', pasteGeojson);
        return behavior;
    }


    behavior.off = function() {
        context.keybinding().off(uiCmd('⌘V'));
        d3_select(document).on('paste.behaviorPaste', null);
    };


    return behavior;
}
