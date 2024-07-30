
import { actionCopyEntities } from '../actions/copy_entities';
import { actionMove } from '../actions/move';
import { modeSelect } from '../modes/select';
import { geoExtent, geoVecSubtract } from '../geo';
import { t } from '../core/localizer';
import { uiCmd } from '../ui/cmd';
import { utilDisplayLabel } from '../util/util';

// see also `behaviorPaste`
export function operationPaste(context) {

    var _pastePoint;

    var operation = function() {

        if (!_pastePoint) return;

        var oldIDs = context.copyIDs();
        if (!oldIDs.length) return;

        var projection = context.projection;
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

        // Use the location of the copy operation to offset the paste location,
        // or else use the center of the pasted extent
        var copyPoint = (context.copyLonLat() && projection(context.copyLonLat())) ||
            projection(extent.center());
        var delta = geoVecSubtract(_pastePoint, copyPoint);

        // Move the pasted objects to be anchored at the paste location
        context.replace(actionMove(newIDs, delta, projection), operation.annotation());
        context.enter(modeSelect(context, newIDs));
    };

    operation.point = function(val) {
        _pastePoint = val;
        return operation;
    };

    operation.available = function() {
        return context.mode().id === 'browse';
    };

    operation.disabled = function() {
        return !context.copyIDs().length;
    };

    operation.tooltip = function() {
        var oldGraph = context.copyGraph();
        var ids = context.copyIDs();
        if (!ids.length) {
            return t.append('operations.paste.nothing_copied');
        }
        return t.append('operations.paste.description', { feature: utilDisplayLabel(oldGraph.entity(ids[0]), oldGraph), n: ids.length });
    };

    operation.annotation = function() {
        var ids = context.copyIDs();
        return t('operations.paste.annotation', { n: ids.length });
    };

    operation.id = 'paste';
    operation.keys = [uiCmd('⌘V')];
    operation.title = t.append('operations.paste.title');

    return operation;
}
