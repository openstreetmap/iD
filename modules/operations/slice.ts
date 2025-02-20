import { t } from '../core/localizer';

import { actionSlice } from '../actions/slice';

import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import type { geoExtent } from '../geo';
import type { EntityId, WayId } from '../osm';


export function operationSlice(context: iD.Context, selectedIDs: EntityId[]) {
    const _action = getAction();

    let _cutlineId: WayId;
    let _areaId: WayId;
    let _extent: geoExtent;


    function getAction() {
        return actionSlice(selectedIDs as WayId[]);
    }


    const operation = function() {
        if (operation.disabled()) return;

        context.perform(_action, operation.annotation());

        context.validator().validate();

        // Select the new areas so the user can immediately work with them
        context.enter(modeSelect(context, _action.getResultingWayIds()));
    };


    operation.available = function() {
        // Splicing operation is shown when the user selects something
        // that resembles a splicable setup - a line within an area

        if (selectedIDs.length === 0) return false;

        if (selectedIDs.length > 2) {
            // More than 2 ways would be ambiguous and we don't support "multi-splicing"
            return false;
        }

        let graph = context.graph();

        if (selectedIDs.length === 2) {
            // Selected entities must be 2 ways - cut line within an area

            let entity1 = graph.entity(selectedIDs[0]);
            if (entity1.type !== 'way') return false;

            let entity2 = graph.entity(selectedIDs[1]);
            if (entity2.type !== 'way') return false;

            // One way must be open (cut line) and one must closed (parent area to be cut)

            let way1Closed = entity1.isClosed();
            let way2Closed = entity2.isClosed();
            if (way1Closed && way2Closed || !way1Closed && !way2Closed) return false;

            let ways = _action.tellApartCutLineAndArea(graph, selectedIDs as WayId[]); // 0 is cut line and 1 is parent area

            if (!_action.isSplicableArea(graph, ways[1])) return false;

            let startNode = ways[0].nodes[0];
            let endNode = ways[0].nodes[ways[0].nodes.length - 1];

            // Cut line must start and end on the parent area's outline
            if (!ways[1].contains(startNode)) return false;
            if (!ways[1].contains(endNode)) return false;

            // Cut line cannot be an edge of the parent area
            if (ways[0].nodes.length === 2 && ways[1].areAdjacent(startNode, endNode)) return false;

            _cutlineId = ways[0].id;
            _areaId = ways[1].id;

        } else if (selectedIDs.length === 1) {
            // See if the selected entity is a way that forms a cut line for an area

            let entity = graph.entity(selectedIDs[0]);
            if (entity.type !== 'way') return false;

            if (entity.isClosed()) return false;

            let parent = _action.getSplicableAreaBetween(graph, entity);

            if (!parent) return false;

            _cutlineId = entity.id;
            _areaId = parent.id;

        }

        _extent = graph.entity(_cutlineId).extent(graph);

        return true;
    };

    operation.relatedEntityIds = function() {
        return [_cutlineId, _areaId];
    };

    operation.disabled = function() {
        if (_extent.percentContainedIn(context.map().extent()) < 0.8) return 'too_large';

        let actionDisabled = _action.disabled!(context.graph());
        if (actionDisabled) return actionDisabled;

        if (operation.relatedEntityIds().some((id) => context.hasHiddenConnections(id))) return 'connected_to_hidden';

        return false;
    };

    operation.tooltip = function() {
        let disabled = operation.disabled();
        if (disabled) {
            let internalReason = _action.disabledInternalReason();
            if (internalReason) {
                return t.append('operations.slice.' + disabled + '_annotated', { annotation: t(internalReason) });
            } else {
                return t.append('operations.slice.' + disabled);
            }
        } else {
            return t.append('operations.slice.description');
        }
    };

    operation.annotation = function() {
        return t('operations.slice.annotation', { n: selectedIDs.length });
    };

    operation.id = 'slice';
    operation.keys = [t('operations.slice.key')];
    operation.title = t.append('operations.slice.title');
    operation.behavior = behaviorOperation(context).which(operation);

    operation.icon = function() {
        return '#iD-operation-slice';
    };

    return operation;
}
