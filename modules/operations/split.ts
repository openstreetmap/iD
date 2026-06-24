import { t } from '../core/localizer';
import { actionSplit } from '../actions/split';
import { behaviorOperation } from '../behavior/operation';
import { modeSelect } from '../modes/select';
import { uiAsyncModal } from '../ui/modal_async';
import { uiLoading } from '../ui';
import { EntityId, type NodeId, type osmWay } from '../osm';
import type { coreDifference } from '../core';


export const operationSplit: iD.CreateOperation = (context, selectedIDs) => {
    var _vertexIds = selectedIDs.filter(function(id): id is NodeId {
        return context.graph().geometry(id) === 'vertex';
    });
    var _selectedWayIds = selectedIDs.filter(function(id) {
        var entity = context.graph().hasEntity(id);
        return entity && entity.type === 'way';
    });
    var _isAvailable = _vertexIds.length > 0 &&
        _vertexIds.length + _selectedWayIds.length === selectedIDs.length;
    var _action = actionSplit(_vertexIds);
    var _ways: osmWay[] = [];
    var _geometry = 'feature';
    var _waysAmount = 'single';
    var _nodesAmount = _vertexIds.length === 1 ? 'single' : 'multiple';

    if (_isAvailable) {
        if (_selectedWayIds.length) _action.limitWays(_selectedWayIds);
        _ways = _action.ways(context.graph());
        var geometries: Record<string, boolean> = {};
        _ways.forEach(function(way) {
            geometries[way.geometry(context.graph())] = true;
        });
        if (Object.keys(geometries).length === 1) {
            _geometry = Object.keys(geometries)[0];
        }
        _waysAmount = _ways.length === 1 ? 'single' : 'multiple';
    }


    const operation: iD.Operation = function() {
        var difference = context.perform(_action, operation.annotation()) as coreDifference;
        // select both the nodes and the ways so the mapper can immediately disconnect them if desired
        var idsToSelect = [..._vertexIds, ...difference.extantIDs().filter(function(id) {
            // filter out relations that may have had member additions
            return context.entity(id).type === 'way';
        })];
        context.enter(modeSelect(context, idsToSelect));
    };


    operation.relatedEntityIds = function() {
        return _selectedWayIds.length ? [] : _ways.map(way => way.id);
    };


    operation.available = function() {
        return _isAvailable;
    };


    operation.disabled = function() {
        var reason = _action.disabled!(context.graph());
        if (reason) {
            return reason;
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }
        return false;
    };

    operation.interrupts = {
        parent_incomplete: async () => {
            const graph = context.graph();

            const confirmed = await uiAsyncModal(context).open(
                t.append('operations.split.title'),
                t.append('operations.split.parent_incomplete'),
            );

            if (!confirmed) return; // user cancelled the operation


            const loading = uiLoading(context).blocking(true);
            context.container().call(loading);

            const requiredWayIds = new Set<EntityId>();

            // find vertex->ways->relations, then find the adjacent way for
            // each relation.
            for (const nodeId of _vertexIds) {
                const ways = _action.waysForNode(nodeId, graph);
                for (const way of ways) {
                    const relations = graph.parentRelations(way);
                    for (const relation of relations) {
                        const indexOfWay = relation.members.findIndex(m => m.id === way.id);

                        const prevWay = relation.members[indexOfWay - 1]?.id;
                        const nextWay = relation.members[indexOfWay + 1]?.id;

                        if (prevWay) requiredWayIds.add(prevWay);
                        if (nextWay) requiredWayIds.add(nextWay);
                    }
                }
            }

            // only download the ways that aren't downloaded yet
            const waysToLoad = [...requiredWayIds]
                .filter(wayId => !context.graph().hasEntity(wayId))
                .map((wayId) => new Promise(resolve => {
                    context.loadEntity(wayId, resolve);
                }));

            await Promise.all(waysToLoad);

            loading.close();

            // now we can resume the interrupted operation
            operation();
        }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable && !operation.interrupts?.[disable] ?
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
};
