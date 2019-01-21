import _uniq from 'lodash-es/uniq';
import _difference from 'lodash-es/difference';
import _includes from 'lodash-es/includes';

import { t } from '../util/locale';
import { actionStraighten } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationStraighten(selectedIDs, context) {
    var action = actionStraighten(selectedIDs, context.projection);


    function operation() {
        context.perform(action, operation.annotation());
    }


    operation.available = function() {
        var nodes = [],
            startNodes = [],
            endNodes = [],
            selectedNodes = [];

        for (var i = 0; i < selectedIDs.length; i++) {
            if (!context.hasEntity(selectedIDs[i])) return false;

            var entity = context.entity(selectedIDs[i]);

            if (entity.type === 'node') {
                selectedNodes.push(entity.id);
                continue;
            }

            if (entity.type !== 'way' ||
                entity.isClosed()) {
                return false;
            }

            nodes = nodes.concat(entity.nodes);
            startNodes.push(entity.nodes[0]);
            endNodes.push(entity.nodes[entity.nodes.length-1]);
        }

        if (_uniq(nodes).length <= 2 || !_includes([0,2], selectedNodes.length)) return false;

        // Ensure all ways are connected (i.e. only one unique start point and one unique end point)
        if (_difference(startNodes, endNodes).length !== 1 ||
            _difference(endNodes, startNodes).length !== 1) return false;

        // Ensure both selected nodes lie on the selected path
        if (selectedNodes.length && (!_includes(nodes, selectedNodes[0]) ||
            !_includes(nodes, selectedNodes[1]))) return false;

        return true;
    };


    operation.disabled = function() {
        var reason;
        for (var i = 0; i < selectedIDs.length; i++) {
            if (context.hasHiddenConnections(selectedIDs[i])) {
                reason = 'connected_to_hidden';
            }
        }
        return action.disabled(context.graph()) || reason;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.straighten.' + disable) :
            t('operations.straighten.description');
    };


    operation.annotation = function() {
        return t('operations.straighten.annotation');
    };


    operation.id = 'straighten';
    operation.keys = [t('operations.straighten.key')];
    operation.title = t('operations.straighten.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
