import { t } from '../util/locale';
import { actionReverse } from '../actions/reverse';
import { behaviorOperation } from '../behavior/operation';


export function operationReverse(selectedIDs, context) {
    var entityID = selectedIDs[0];

    var operation = function() {
        context.perform(action(), operation.annotation());
        context.validator().validate();
    };

    function action() {
        return actionReverse(entityID);
    }

    function isNode() {
        var entity = context.hasEntity(entityID);
        return entity && entity.type === 'node';
    }


    operation.available = function(situation) {
        if (situation === 'toolbar') {
            if (!selectedIDs.some(function(id) {
                var entity = context.hasEntity(id);
                return entity && entity.type === 'way' && (entity.isOneWay() || entity.isSided());
            })) {
                return false;
            }
        }
        if (selectedIDs.length !== 1) return false;

        var geometry = context.geometry(entityID);
        if (geometry !== 'line' && geometry !== 'vertex' && geometry !== 'point') {
            return false;
        }
        return action().disabled(context.graph()) === false;
    };


    operation.disabled = function() {
        return false;
    };


    operation.tooltip = function() {
        var id = isNode() ? 'node.description.single' : 'description';
        return t('operations.reverse.' + id);
    };


    operation.annotation = function() {
        var id = isNode() ? 'node.annotation.single' : 'annotation';
        return t('operations.reverse.' + id);
    };


    operation.id = 'reverse';
    operation.keys = [t('operations.reverse.key')];
    operation.title = t('operations.reverse.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
