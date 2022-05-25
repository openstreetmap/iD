import {
    t
} from '../util/locale';
import {
    actionCloneRoadAttributes
} from '../actions/clone_road_attributes';
import {
    behaviorOperation
} from '../behavior/operation';

export function operationCloneRoadAttributes(selectedIDs, context) {

    const cloneTags = [
        'bus:lanes', 'lanes:bus', 'busway:right', 'busway:left',
        'bus:lanes:forward', 'lanes:bus:forward', 'bus:lanes:backward', 'lanes:bus:backward',
        'lanes', 'lanes:forward', 'lanes:backward',
        'sidewalk', 'sidewalk:right', 'sidewalk:left', 'foot',
        'routing:bicycle', 'bicycle', 'cycleway:both', 'cycleway:right', 'cycleway:left',
        'turn:lanes', 'turn:lanes:forward', 'turn:lanes:backward',
        'placement', 'placement:start', 'placement:end', 'width:lanes:start', 'width:lanes:end',
        'placement:forward', 'width:lanes:forward:start', 'width:lanes:forward:end',
        'placement:backward', 'width:lanes:backward:start', 'width:lanes:backward:end'
    ];
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
            t('operations.clone_road_attributes.' + disable) :
            t('operations.clone_road_attributes.description');
    };


    operation.annotation = function () {
        return t('operations.clone_road_attributes.annotation');
    };


    operation.id = 'clone_road_attributes';
    operation.keys = [t('operations.clone_road_attributes.key')];
    operation.title = t('operations.clone_road_attributes.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
