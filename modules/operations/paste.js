
import { actionCopyEntities } from '../actions/copy_entities';
import { actionMove } from '../actions/move';
import { modeSelect } from '../modes/select';
import { geoExtent, geoVecSubtract } from '../geo';
import { t } from '../core/localizer';
import { uiCmd } from '../ui/cmd';
import { utilDisplayLabel } from '../util/utilDisplayLabel';

// see also `behaviorPaste`
export function operationPaste(context) {

    let _pastePoint;

    const operation = function() {

        if (!_pastePoint) return;

        const oldIDs = context.copyIDs();
        if (!oldIDs.length) return;

        const projection = context.projection;
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

        // Use the location of the copy operation to offset the paste location,
        // or else use the center of the pasted extent
        const copyPoint = (context.copyLonLat() && projection(context.copyLonLat())) ||
            projection(extent.center());
        const delta = geoVecSubtract(_pastePoint, copyPoint);

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
        const oldGraph = context.copyGraph();
        const ids = context.copyIDs();
        if (!ids.length) {
            return t.append('operations.paste.nothing_copied');
        }
        return t.append('operations.paste.description', { feature: utilDisplayLabel(oldGraph.entity(ids[0]), oldGraph), n: ids.length });
    };

    operation.annotation = function() {
        const ids = context.copyIDs();
        return t('operations.paste.annotation', { n: ids.length });
    };

    operation.id = 'paste';
    operation.keys = [uiCmd('⌘V')];
    operation.title = t.append('operations.paste.title');

    return operation;
}
