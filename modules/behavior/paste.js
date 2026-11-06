import { select as d3_select } from 'd3-selection';

import { actionAddEntity } from '../actions/add_entity';
import { actionChangeTags } from '../actions/change_tags';
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
// copied from another tool (e.g. addresses to add) are added as nodes with their properties as tags, and the
// tags of a point with an `osm_id` are added to this OSM element (see `utilGeojsonPoints`).
export function behaviorPaste(context) {

    // Show a message of the paste not done (or not completely)
    function flashNotPasted(label) {
        context.ui().flash
            .duration(4000)
            .iconName('#iD-icon-no')
            .iconClass('disabled')
            .label(label)();
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


    // Add the GeoJSON points of the clipboard as nodes at their position, and the tags of those with an OSM
    // element to this element, without replacing its existing tags; then select the added and changed features.
    // The OSM elements must be loaded (in the map view): the others are left out, with a message.
    function pasteGeojson(d3_event) {
        // A text field gets the pasted text
        if (d3_event.target.closest?.('input, textarea, [contenteditable]')) return;
        if (!canPaste() || context.copyIDs().length) return;

        var points = utilGeojsonPoints(d3_event.clipboardData?.getData('text/plain') ?? '');
        if (!points.length) {
            flashNotPasted(t.append('operations.paste.nothing_copied'));
            return;
        }
        d3_event.preventDefault();

        var nodes = points.filter(function(point) { return !point.entityID; }).map(function(point) {
            return new osmNode({ loc: point.loc, tags: point.tags });
        });
        var corrections = points.filter(function(point) { return point.entityID; });
        var loaded = corrections.filter(function(point) { return context.hasEntity(point.entityID); });
        var ids = nodes.map(function(node) { return node.id; })
            .concat(loaded.map(function(point) { return point.entityID; }));
        if (!ids.length) {
            flashNotPasted(t.append('operations.paste.geojson_not_loaded', { n: corrections.length }));
            return;
        }
        context.perform(
            function(graph) {
                graph = nodes.reduce(function(result, node) { return actionAddEntity(node)(result); }, graph);
                return loaded.reduce(function(result, point) {
                    var tags = result.entity(point.entityID).tags;
                    return actionChangeTags(point.entityID, { ...point.tags, ...tags })(result);
                }, graph);
            },
            t('operations.paste.annotation', { n: ids.length })
        );
        context.enter(modeSelect(context, ids));
        if (loaded.length < corrections.length) {
            flashNotPasted(t.append('operations.paste.geojson_not_loaded', { n: corrections.length - loaded.length }));
        }
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
