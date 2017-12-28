import _uniq from 'lodash-es/uniq';
import { t } from '../util/locale';
import { actionJoinLanegroup } from '../actions';
import { behaviorOperation } from '../behavior';
import {geoExtent} from '../geo';

//selectIDS represent the object selected, ways points for example
export function operationJoinLanegroup(selectedIDs, context) {
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple'),
        //???
        extent = selectedIDs.reduce(function(extent, id) {
            return extent.extend(context.entity(id).extent(context.graph()));
        }, geoExtent());

    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        action = actionJoinLanegroup(selectedIDs, context.projection,context);


    var operation = function() {
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return selectedIDs.length >= 2 && entity.type === 'way';
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            _uniq(entity.nodes).length > 1;
    };


    operation.disabled = function() {
        return false;
        var reason;
        if (extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (context.hasHiddenConnections(entityId)) {
            reason = 'connected_to_hidden';
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        return 'AddAnota';
        return t('operation.circularze.description.');
        var disable = operation.disabled();
        return disable ?
            t('operations.circularize.' + disable) :
            t('operations.circularize.description.' );
    };


    operation.annotation = function() {
        return 'Hello';
    };


    operation.id = 'join_lane_group';
    operation.keys = 'Join_Lane_group';
    operation.title = 'Join_lanegroup';
    operation.behavior = behaviorOperation(context).which(operation);




    return operation;
}
