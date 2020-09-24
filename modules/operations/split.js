import { t } from '../core/localizer';
import { actionSplit } from '../actions/split';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';


export function operationSplit(context, selectedIDs) {
    var _vertexIds = selectedIDs.filter(function(id) {
        return context.graph().geometry(id) === 'vertex';
    });
    var _selectedWayIds = selectedIDs.filter(function(id) {
        var entity = context.graph().hasEntity(id);
        return entity && entity.type === 'way';
    });
    var _isAvailable = _vertexIds.length > 0 &&
        _vertexIds.length + _selectedWayIds.length === selectedIDs.length;
    var _action = actionSplit(_vertexIds);
    var _ways = [];

    if (_isAvailable) {
        if (_selectedWayIds.length) _action.limitWays(_selectedWayIds);
        _ways = _action.ways(context.graph());
    }


    var operation = function() {
        var difference = context.perform(_action, operation.annotation());
        context.enter(modeSelect(context, difference.extantIDs()));
    };


    operation.available = function() {
        return _isAvailable;
    };


    operation.disabled = function() {
        var reason = _action.disabled(context.graph());
        if (reason) {
            return reason;
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }
        return false;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        if (disable) {
            return t('operations.split.' + disable);
        } else if (_ways.length === 1) {
            return t('operations.split.description.' + context.graph().geometry(_ways[0].id));
        }
        return t('operations.split.description.multiple');
    };


    operation.annotation = function() {
        return _ways.length === 1 ?
            t('operations.split.annotation.' + context.graph().geometry(_ways[0].id)) :
            t('operations.split.annotation.feature', { n: _ways.length });
    };


    operation.id = 'split';
    operation.keys = [t('operations.split.key')];
    operation.title = t('operations.split.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
