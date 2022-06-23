import { t } from '../core/localizer';
import { actionReverse } from '../actions/reverse';
import { behaviorOperation } from '../behavior/operation';


export function operationReverse(context, selectedIDs) {

    var operation = function() {
        context.perform(function combinedReverseAction(graph) {
            actions().forEach(function(action) {
                graph = action(graph);
            });
            return graph;
        }, operation.annotation());
        context.validator().validate();
    };

    function actions(situation) {
        return selectedIDs.map(function(entityID) {
            var entity = context.hasEntity(entityID);
            if (!entity) return null;

            if (situation === 'toolbar') {
                if (entity.type === 'way' &&
                    (!entity.isOneWay() && !entity.isSided())) return null;
            }

            var geometry = entity.geometry(context.graph());
            if (entity.type !== 'node' && geometry !== 'line') return null;

            var action = actionReverse(entityID);
            if (action.disabled(context.graph())) return null;

            return action;
        }).filter(Boolean);
    }

    function reverseTypeID() {
        var acts = actions();
        var nodeActionCount = acts.filter(function(act) {
            var entity = context.hasEntity(act.entityID());
            return entity && entity.type === 'node';
        }).length;
        if (nodeActionCount === 0) return 'line';
        if (nodeActionCount === acts.length) return 'point';
        return 'feature';
    }


    operation.available = function(situation) {
        return actions(situation).length > 0;
    };


    operation.disabled = function() {
        return false;
    };


    operation.tooltip = function() {
        return t.append('operations.reverse.description.' + reverseTypeID());
    };


    operation.annotation = function() {
        var acts = actions();
        return t('operations.reverse.annotation.' + reverseTypeID(), { n: acts.length });
    };


    operation.id = 'reverse';
    operation.keys = [t('operations.reverse.key')];
    operation.title = t.append('operations.reverse.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
