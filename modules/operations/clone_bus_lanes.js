import {
    t
} from '../util/locale';
import {
    actionCloneRoadAttributes
} from '../actions/clone_road_attributes';
import {
    behaviorOperation
} from '../behavior/operation';

export function operationCloneBusLanes(selectedIDs, context) {

    const cloneTags = ['bus:lanes', 'bus:lanes:forward', 'bus:lanes:backward', 'lanes:bus', 'lanes:bus:forward', 'lanes:bus:backward', 'busway:right', 'busway:left', 'routing:bus', 'bus'];
    var action = actionCloneRoadAttributes(selectedIDs, cloneTags);

    var operation = function () {
        context.perform(action, operation.annotation());

        window.setTimeout(function () {
            context.validator().validate();
        }, 300); // after any transition
    };


    operation.available = function () {

        if (selectedIDs.length >= 2) {
            const entity = context.entity(selectedIDs[0]);
            for (let i = 0, count = cloneTags.length; i < count; i++) {
                if (entity.tags[cloneTags[i]] !== undefined) {
                    return true;
                }
            }
        }
        return false;

    };


    // don't cache this because the visible extent could change
    operation.disabled = function () {
        
        return false;

    };

    operation.tooltip = function () {
        var disable = operation.disabled();
        return disable ?
            t('operations.clone_bus_lanes.' + disable) :
            t('operations.clone_bus_lanes.description');
    };


    operation.annotation = function () {
        return t('operations.clone_bus_lanes.annotation');
    };


    operation.id = 'clone_bus_lanes';
    operation.keys = [t('operations.clone_bus_lanes.key')];
    operation.title = t('operations.clone_bus_lanes.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
