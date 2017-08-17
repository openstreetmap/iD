import _ from 'lodash';
import { t } from '../util/locale';
import { actionReflect } from '../actions';
import { behaviorOperation } from '../behavior';
import { geoExtent } from '../geo';
import { utilGetAllNodes } from '../util';


export function operationReflectShort(selectedIDs, context) {
    return operationReflect(selectedIDs, context, 'short');
}


export function operationReflectLong(selectedIDs, context) {
    return operationReflect(selectedIDs, context, 'long');
}


export function operationReflect(selectedIDs, context, axis) {
    axis = axis || 'long';
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple'),
        extent = selectedIDs.reduce(function(extent, id) {
            return extent.extend(context.entity(id).extent(context.graph()));
        }, geoExtent());


    var operation = function() {
        var action = actionReflect(selectedIDs, context.projection)
            .useLongAxis(Boolean(axis === 'long'));
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        var nodes = utilGetAllNodes(selectedIDs, context.graph());
        return _.uniqBy(nodes, function(n) { return n.loc; }).length >= 3;
    };


    operation.disabled = function() {
        var reason;
        if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (_.some(selectedIDs, context.hasHiddenConnections)) {
            reason = 'connected_to_hidden';
        } else if (_.some(selectedIDs, incompleteRelation)) {
            reason = 'incomplete_relation';
        }
        return reason;

        function incompleteRelation(id) {
            var entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.reflect.' + disable + '.' + multi) :
            t('operations.reflect.description.' + axis + '.' + multi);
    };


    operation.annotation = function() {
        return t('operations.reflect.annotation.' + axis + '.' + multi);
    };


    operation.id = 'reflect-' + axis;
    operation.keys = [t('operations.reflect.key.' + axis)];
    operation.title = t('operations.reflect.title.' + axis);
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
