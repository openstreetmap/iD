import { t } from '../core/localizer';
import { actionCircularize } from '../actions/circularize';
import { behaviorOperation } from '../behavior/operation';
import { utilGetAllNodes } from '../util';
import { svgPath } from '../svg';
import { osmIdManager, osmJoinWays, osmWay, type EntityId } from '../osm';
import { actionAddEntity, actionDeleteWay } from '../actions';
import type { coreGraph } from '../core';
import type { Action } from '../core/history';


export const operationCircularize: iD.CreateOperation = (context, selectedIDs) => {
    const _extent = selectedIDs.length > 0 ? selectedIDs
        .map(id => context.graph().entity(id).extent(context.graph()))
        .reduce((a, b) => a.extend(b)) : undefined;
    const _amount = selectedIDs
        .filter(id => checkActionAllowed(id, context.graph()))
        .length === 1 ? 'single' : 'multiple';
    const _coords = utilGetAllNodes(selectedIDs, context.graph())
        .map(function(n) { return n.loc; });

    const _actions = function() {
        // try joining unclosed ways into loops
        const initialGraph = context.graph();
        const joined = osmJoinWays(selectedIDs
            .filter(id => checkActionAllowed(id, context.graph()))
            .map(id => ({ type: 'way', id, role: '' }) as never as osmWay), // FIXME: this is sus
            initialGraph);
        const rings = joined
            .map(ring => ring.length === 1
                // ring consists of a single closed way: use it directly
                ? ring[0]
                // otherwise: create temporary auxiliary way to circularize
                // the nodes of the closed loop
                : new osmWay({
                    id: osmIdManager.newId('way'),
                    nodes: ring.nodes.map(n => n.id)
                }));
        return [
            // add temporary auxiliary ways (if necessary)
            ...rings
                .filter(way => !initialGraph.hasEntity(way.id))
                .map(way => actionAddEntity(way)),
            // circularize closed ways
            ...rings
                .map(way => actionCircularize(way.id, context.projection)),
            // clean up temporary auxiliary ways
            ...rings
                .filter(way => !initialGraph.hasEntity(way.id))
                .map(way => actionDeleteWay(way.id)),
        ];
    }();

    function checkActionAllowed(entityID: EntityId, graph: coreGraph) {
        const entity = graph.entity(entityID);
        if (entity.type !== 'way' || new Set(entity.nodes).size <= 1) return false;
        return true;
    }

    const operation: iD.Operation = function() {
        if (!_actions.length) return;

        var combinedAction: Action = function(graph, t) {
            _actions.forEach(function(action) {
                if (!action.disabled?.(graph)) {
                    graph = action(graph, t);
                }
            });
            return graph;
        };
        combinedAction.transitionable = true;

        context.perform(combinedAction, operation.annotation());

        window.setTimeout(function() {
            context.validator().validate();
        }, 300);  // after any transition
    };


    operation.available = function() {
        const graph = context.graph();
        return selectedIDs.length > 0 && selectedIDs.every(id => checkActionAllowed(id, graph));
    };


    // don't cache this because the visible extent could change
    operation.disabled = function() {
        if (!_actions.length) return '';

        let graph = context.graph();
        const actionDisableds = _actions
            .map(action => {
                const reason = action.disabled?.(graph);
                if (typeof reason !== 'string') graph = action(graph);
                return reason;
            });

        if (actionDisableds.every(reason => reason === undefined || reason !== false)) {
            // none of the features can be circularized

            if (new Set(actionDisableds.filter(Boolean)).size > 1) {
                return 'multiple_blockers';
            }

            return actionDisableds.filter(Boolean)[0];
        } else if (_extent!.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        } else if (someMissing()) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        }

        return false;


        function someMissing() {
            if (context.inIntro()) return false;
            var osm = context.connection();
            if (osm) {
                var missing = _coords.filter(function(loc) { return !osm.isDataLoaded(loc); });
                if (missing.length) {
                    missing.forEach(function(loc) { context.loadTileAtLoc(loc); });
                    return true;
                }
            }
            return false;
        }
    };


    operation.getAuxiliaryGeometry = function() {
        let previewGraph = context.graph();
        return _actions.map(action => {
            if (!action.disabled?.(previewGraph)) {
                previewGraph = action(previewGraph);
                if (action.id !== 'circularize') return false;
                const way = previewGraph.hasEntity(action.getWayId!())!;
                const getPath = svgPath(context.projection, previewGraph, false);
                return {
                    id: way.id,
                    path: getPath(way),
                    klass: 'preview'
                };
            } else {
                return false;
            }
        }).filter(Boolean);
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t.append('operations.circularize.' + disable + '.' + _amount) :
            t.append('operations.circularize.description.' + _amount);
    };


    operation.annotation = function() {
        return t('operations.circularize.annotation.feature', { n: _actions.length });
    };


    operation.id = 'circularize';
    operation.keys = [t('operations.circularize.key')];
    operation.title = t.append('operations.circularize.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
};
