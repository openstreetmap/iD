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
    var _geometry = 'feature';
    var _waysAmount = 'single';
    var _nodesAmount = _vertexIds.length === 1 ? 'single' : 'multiple';

    if (_isAvailable) {
        if (_selectedWayIds.length) _action.limitWays(_selectedWayIds);
        _ways = _action.ways(context.graph());
        var geometries = {};
        _ways.forEach(function(way) {
            geometries[way.geometry(context.graph())] = true;
        });
        if (Object.keys(geometries).length === 1) {
            _geometry = Object.keys(geometries)[0];
        }
        _waysAmount = _ways.length === 1 ? 'single' : 'multiple';
    }


    var operation = function() {
        var difference = context.perform(_action, operation.annotation());
        // select both the nodes and the ways so the mapper can immediately disconnect them if desired
        var idsToSelect = _vertexIds.concat(difference.extantIDs().filter(function(id) {
            // filter out relations that may have had member additions
            return context.entity(id).type === 'way';
        }));
        context.enter(modeSelect(context, idsToSelect));
    };


    operation.relatedEntityIds = function() {
        return _selectedWayIds.length ? [] : _ways.map(way => way.id);
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
        return disable ?
            t.append('operations.split.' + disable) :
            t.append('operations.split.description.' + _geometry + '.' + _waysAmount + '.' + _nodesAmount + '_node');
    };


    operation.annotation = function() {
        return t('operations.split.annotation.' + _geometry, { n: _ways.length });
    };


    operation.icon = function() {
        if (_waysAmount === 'multiple') {
            return '#iD-operation-split-multiple';
        } else {
            return '#iD-operation-split';
        }
    };


    operation.id = 'split';
    operation.keys = [t('operations.split.key')];
    operation.title = t.append('operations.split.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
