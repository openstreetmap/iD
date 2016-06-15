(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.operations = global.iD.operations || {})));
}(this, function (exports) { 'use strict';

    function Circularize(selectedIDs, context) {
        var entityId = selectedIDs[0],
            entity = context.entity(entityId),
            extent = entity.extent(context.graph()),
            geometry = context.geometry(entityId),
            action = iD.actions.Circularize(entityId, context.projection);

        var operation = function() {
            var annotation = t('operations.circularize.annotation.' + geometry);
            context.perform(action, annotation);
        };

        operation.available = function() {
            return selectedIDs.length === 1 &&
                entity.type === 'way' &&
                _.uniq(entity.nodes).length > 1;
        };

        operation.disabled = function() {
            var reason;
            if (extent.percentContainedIn(context.extent()) < 0.8) {
                reason = 'too_large';
            } else if (context.hasHiddenConnections(entityId)) {
                reason = 'connected_to_hidden';
            }
            return action.disabled(context.graph()) || reason;
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.circularize.' + disable) :
                t('operations.circularize.description.' + geometry);
        };

        operation.id = 'circularize';
        operation.keys = [t('operations.circularize.key')];
        operation.title = t('operations.circularize.title');

        return operation;
    }

    function Continue(selectedIDs, context) {
        var graph = context.graph(),
            entities = selectedIDs.map(function(id) { return graph.entity(id); }),
            geometries = _.extend({line: [], vertex: []},
                _.groupBy(entities, function(entity) { return entity.geometry(graph); })),
            vertex = geometries.vertex[0];

        function candidateWays() {
            return graph.parentWays(vertex).filter(function(parent) {
                return parent.geometry(graph) === 'line' &&
                    parent.affix(vertex.id) &&
                    (geometries.line.length === 0 || geometries.line[0] === parent);
            });
        }

        var operation = function() {
            var candidate = candidateWays()[0];
            context.enter(iD.modes.DrawLine(
                context,
                candidate.id,
                context.graph(),
                candidate.affix(vertex.id)));
        };

        operation.available = function() {
            return geometries.vertex.length === 1 && geometries.line.length <= 1 &&
                !context.features().hasHiddenConnections(vertex, context.graph());
        };

        operation.disabled = function() {
            var candidates = candidateWays();
            if (candidates.length === 0)
                return 'not_eligible';
            if (candidates.length > 1)
                return 'multiple';
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.continue.' + disable) :
                t('operations.continue.description');
        };

        operation.id = 'continue';
        operation.keys = [t('operations.continue.key')];
        operation.title = t('operations.continue.title');

        return operation;
    }

    function Delete(selectedIDs, context) {
        var action = iD.actions.DeleteMultiple(selectedIDs);

        var operation = function() {
            var annotation,
                nextSelectedID;

            if (selectedIDs.length > 1) {
                annotation = t('operations.delete.annotation.multiple', {n: selectedIDs.length});

            } else {
                var id = selectedIDs[0],
                    entity = context.entity(id),
                    geometry = context.geometry(id),
                    parents = context.graph().parentWays(entity),
                    parent = parents[0];

                annotation = t('operations.delete.annotation.' + geometry);

                // Select the next closest node in the way.
                if (geometry === 'vertex' && parents.length === 1 && parent.nodes.length > 2) {
                    var nodes = parent.nodes,
                        i = nodes.indexOf(id);

                    if (i === 0) {
                        i++;
                    } else if (i === nodes.length - 1) {
                        i--;
                    } else {
                        var a = iD.geo.sphericalDistance(entity.loc, context.entity(nodes[i - 1]).loc),
                            b = iD.geo.sphericalDistance(entity.loc, context.entity(nodes[i + 1]).loc);
                        i = a < b ? i - 1 : i + 1;
                    }

                    nextSelectedID = nodes[i];
                }
            }

            if (nextSelectedID && context.hasEntity(nextSelectedID)) {
                context.enter(iD.modes.Select(context, [nextSelectedID]));
            } else {
                context.enter(iD.modes.Browse(context));
            }

            context.perform(
                action,
                annotation);
        };

        operation.available = function() {
            return true;
        };

        operation.disabled = function() {
            var reason;
            if (_.some(selectedIDs, context.hasHiddenConnections)) {
                reason = 'connected_to_hidden';
            }
            return action.disabled(context.graph()) || reason;
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.delete.' + disable) :
                t('operations.delete.description');
        };

        operation.id = 'delete';
        operation.keys = [iD.ui.cmd('⌘⌫'), iD.ui.cmd('⌘⌦')];
        operation.title = t('operations.delete.title');

        return operation;
    }

    function Disconnect(selectedIDs, context) {
        var vertices = _.filter(selectedIDs, function vertex(entityId) {
            return context.geometry(entityId) === 'vertex';
        });

        var entityId = vertices[0],
            action = iD.actions.Disconnect(entityId);

        if (selectedIDs.length > 1) {
            action.limitWays(_.without(selectedIDs, entityId));
        }

        var operation = function() {
            context.perform(action, t('operations.disconnect.annotation'));
        };

        operation.available = function() {
            return vertices.length === 1;
        };

        operation.disabled = function() {
            var reason;
            if (_.some(selectedIDs, context.hasHiddenConnections)) {
                reason = 'connected_to_hidden';
            }
            return action.disabled(context.graph()) || reason;
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.disconnect.' + disable) :
                t('operations.disconnect.description');
        };

        operation.id = 'disconnect';
        operation.keys = [t('operations.disconnect.key')];
        operation.title = t('operations.disconnect.title');

        return operation;
    }

    function Merge(selectedIDs, context) {
        var join = iD.actions.Join(selectedIDs),
            merge = iD.actions.Merge(selectedIDs),
            mergePolygon = iD.actions.MergePolygon(selectedIDs);

        var operation = function() {
            var annotation = t('operations.merge.annotation', {n: selectedIDs.length}),
                action;

            if (!join.disabled(context.graph())) {
                action = join;
            } else if (!merge.disabled(context.graph())) {
                action = merge;
            } else {
                action = mergePolygon;
            }

            context.perform(action, annotation);
            context.enter(iD.modes.Select(context, selectedIDs.filter(function(id) { return context.hasEntity(id); }))
                .suppressMenu(true));
        };

        operation.available = function() {
            return selectedIDs.length >= 2;
        };

        operation.disabled = function() {
            return join.disabled(context.graph()) &&
                merge.disabled(context.graph()) &&
                mergePolygon.disabled(context.graph());
        };

        operation.tooltip = function() {
            var j = join.disabled(context.graph()),
                m = merge.disabled(context.graph()),
                p = mergePolygon.disabled(context.graph());

            if (j === 'restriction' && m && p)
                return t('operations.merge.restriction', {relation: context.presets().item('type/restriction').name()});

            if (p === 'incomplete_relation' && j && m)
                return t('operations.merge.incomplete_relation');

            if (j && m && p)
                return t('operations.merge.' + j);

            return t('operations.merge.description');
        };

        operation.id = 'merge';
        operation.keys = [t('operations.merge.key')];
        operation.title = t('operations.merge.title');

        return operation;
    }

    function Move(selectedIDs, context) {
        var extent = selectedIDs.reduce(function(extent, id) {
                return extent.extend(context.entity(id).extent(context.graph()));
            }, iD.geo.Extent());

        var operation = function() {
            context.enter(iD.modes.Move(context, selectedIDs));
        };

        operation.available = function() {
            return selectedIDs.length > 1 ||
                context.entity(selectedIDs[0]).type !== 'node';
        };

        operation.disabled = function() {
            var reason;
            if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
                reason = 'too_large';
            } else if (_.some(selectedIDs, context.hasHiddenConnections)) {
                reason = 'connected_to_hidden';
            }
            return iD.actions.Move(selectedIDs).disabled(context.graph()) || reason;
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.move.' + disable) :
                t('operations.move.description');
        };

        operation.id = 'move';
        operation.keys = [t('operations.move.key')];
        operation.title = t('operations.move.title');

        return operation;
    }

    function Orthogonalize(selectedIDs, context) {
        var entityId = selectedIDs[0],
            entity = context.entity(entityId),
            extent = entity.extent(context.graph()),
            geometry = context.geometry(entityId),
            action = iD.actions.Orthogonalize(entityId, context.projection);

        var operation = function() {
            var annotation = t('operations.orthogonalize.annotation.' + geometry);
            context.perform(action, annotation);
        };

        operation.available = function() {
            return selectedIDs.length === 1 &&
                entity.type === 'way' &&
                entity.isClosed() &&
                _.uniq(entity.nodes).length > 2;
        };

        operation.disabled = function() {
            var reason;
            if (extent.percentContainedIn(context.extent()) < 0.8) {
                reason = 'too_large';
            } else if (context.hasHiddenConnections(entityId)) {
                reason = 'connected_to_hidden';
            }
            return action.disabled(context.graph()) || reason;
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.orthogonalize.' + disable) :
                t('operations.orthogonalize.description.' + geometry);
        };

        operation.id = 'orthogonalize';
        operation.keys = [t('operations.orthogonalize.key')];
        operation.title = t('operations.orthogonalize.title');

        return operation;
    }

    function Reverse(selectedIDs, context) {
        var entityId = selectedIDs[0];

        var operation = function() {
            context.perform(
                iD.actions.Reverse(entityId),
                t('operations.reverse.annotation'));
        };

        operation.available = function() {
            return selectedIDs.length === 1 &&
                context.geometry(entityId) === 'line';
        };

        operation.disabled = function() {
            return false;
        };

        operation.tooltip = function() {
            return t('operations.reverse.description');
        };

        operation.id = 'reverse';
        operation.keys = [t('operations.reverse.key')];
        operation.title = t('operations.reverse.title');

        return operation;
    }

    function Rotate(selectedIDs, context) {
        var entityId = selectedIDs[0],
            entity = context.entity(entityId),
            extent = entity.extent(context.graph()),
            geometry = context.geometry(entityId);

        var operation = function() {
            context.enter(iD.modes.RotateWay(context, entityId));
        };

        operation.available = function() {
            if (selectedIDs.length !== 1 || entity.type !== 'way')
                return false;
            if (geometry === 'area')
                return true;
            if (entity.isClosed() &&
                context.graph().parentRelations(entity).some(function(r) { return r.isMultipolygon(); }))
                return true;
            return false;
        };

        operation.disabled = function() {
            if (extent.percentContainedIn(context.extent()) < 0.8) {
                return 'too_large';
            } else if (context.hasHiddenConnections(entityId)) {
                return 'connected_to_hidden';
            } else {
                return false;
            }
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.rotate.' + disable) :
                t('operations.rotate.description');
        };

        operation.id = 'rotate';
        operation.keys = [t('operations.rotate.key')];
        operation.title = t('operations.rotate.title');

        return operation;
    }

    function Split(selectedIDs, context) {
        var vertices = _.filter(selectedIDs, function vertex(entityId) {
            return context.geometry(entityId) === 'vertex';
        });

        var entityId = vertices[0],
            action = iD.actions.Split(entityId);

        if (selectedIDs.length > 1) {
            action.limitWays(_.without(selectedIDs, entityId));
        }

        var operation = function() {
            var annotation;

            var ways = action.ways(context.graph());
            if (ways.length === 1) {
                annotation = t('operations.split.annotation.' + context.geometry(ways[0].id));
            } else {
                annotation = t('operations.split.annotation.multiple', {n: ways.length});
            }

            var difference = context.perform(action, annotation);
            context.enter(iD.modes.Select(context, difference.extantIDs()));
        };

        operation.available = function() {
            return vertices.length === 1;
        };

        operation.disabled = function() {
            var reason;
            if (_.some(selectedIDs, context.hasHiddenConnections)) {
                reason = 'connected_to_hidden';
            }
            return action.disabled(context.graph()) || reason;
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            if (disable) {
                return t('operations.split.' + disable);
            }

            var ways = action.ways(context.graph());
            if (ways.length === 1) {
                return t('operations.split.description.' + context.geometry(ways[0].id));
            } else {
                return t('operations.split.description.multiple');
            }
        };

        operation.id = 'split';
        operation.keys = [t('operations.split.key')];
        operation.title = t('operations.split.title');

        return operation;
    }

    function Straighten(selectedIDs, context) {
        var entityId = selectedIDs[0],
            action = iD.actions.Straighten(entityId, context.projection);

        function operation() {
            var annotation = t('operations.straighten.annotation');
            context.perform(action, annotation);
        }

        operation.available = function() {
            var entity = context.entity(entityId);
            return selectedIDs.length === 1 &&
                entity.type === 'way' &&
                !entity.isClosed() &&
                _.uniq(entity.nodes).length > 2;
        };

        operation.disabled = function() {
            var reason;
            if (context.hasHiddenConnections(entityId)) {
                reason = 'connected_to_hidden';
            }
            return action.disabled(context.graph()) || reason;
        };

        operation.tooltip = function() {
            var disable = operation.disabled();
            return disable ?
                t('operations.straighten.' + disable) :
                t('operations.straighten.description');
        };

        operation.id = 'straighten';
        operation.keys = [t('operations.straighten.key')];
        operation.title = t('operations.straighten.title');

        return operation;
    }

    exports.Circularize = Circularize;
    exports.Continue = Continue;
    exports.Delete = Delete;
    exports.Disconnect = Disconnect;
    exports.Merge = Merge;
    exports.Move = Move;
    exports.Orthogonalize = Orthogonalize;
    exports.Reverse = Reverse;
    exports.Rotate = Rotate;
    exports.Split = Split;
    exports.Straighten = Straighten;

    Object.defineProperty(exports, '__esModule', { value: true });

}));