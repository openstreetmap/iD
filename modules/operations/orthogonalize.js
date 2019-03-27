import { t } from '../util/locale';
import { actionOrthogonalize } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationOrthogonalize(selectedIDs, context) {
    var _entityID;
    var _entity;
    var _geometry;
    var action = chooseAction();


    function chooseAction() {
        if (selectedIDs.length !== 1) return null;

        _entityID = selectedIDs[0];
        _entity = context.entity(_entityID);
        _geometry = context.geometry(_entityID);

        // square a line/area
        if (_entity.type === 'way' && new Set(_entity.nodes).size > 2 ) {
            return actionOrthogonalize(_entityID, context.projection);

        // square a single vertex
        } else if (_geometry === 'vertex') {
            var graph = context.graph();
            var parents = graph.parentWays(_entity);
            if (parents.length === 1) {
                var way = parents[0];
                if (way.nodes.indexOf(_entityID) !== -1) {
                    return actionOrthogonalize(way.id, context.projection, _entityID);
                }
            }
        }

        return null;
    }


    var operation = function() {
        if (!action) return;
        context.perform(action, operation.annotation());
    };


    operation.available = function() {
        return Boolean(action);
    };


    operation.disabled = function() {
        if (!action) return '';

        var extent = _entity.extent(context.graph());
        var reason;

        if (_geometry !== 'vertex' && extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (context.hasHiddenConnections(_entityID)) {
            reason = 'connected_to_hidden';
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.orthogonalize.' + disable) :
            t('operations.orthogonalize.description.' + _geometry);
    };


    operation.annotation = function() {
        return t('operations.orthogonalize.annotation.' + _geometry);
    };


    operation.id = 'orthogonalize';
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
