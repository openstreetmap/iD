import { osmNode } from '../osm/node';


// Disconnect the ways at the given node.
//
// Optionally, disconnect only the given ways.
//
// For testing convenience, accepts an ID to assign to the (first) new node.
// Normally, this will be undefined and the way will automatically
// be assigned a new ID.
//
// This is the inverse of `iD.actionConnect`.
//
// Reference:
//   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/UnjoinNodeAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/UnGlueAction.java
//
export function actionDisconnect(nodeId, newNodeId) {
    let wayIds;

    const disconnectableRelationTypes = {
        'associatedStreet': true,
        'enforcement': true,
        'site': true,
    };

    const action = function(graph) {
        const node = graph.entity(nodeId);
        const connections = action.connections(graph);

        connections.forEach(function(connection) {
            const way = graph.entity(connection.wayID);
            const newNode = osmNode({id: newNodeId, loc: node.loc, tags: node.tags});

            graph = graph.replace(newNode);
            if (connection.index === 0 && way.isArea()) {
                // replace shared node with shared node..
                graph = graph.replace(way.replaceNode(way.nodes[0], newNode.id));
            } else if (way.isClosed() && connection.index === way.nodes.length - 1) {
                // replace closing node with new new node..
                graph = graph.replace(way.unclose().addNode(newNode.id));
            } else {
                // replace shared node with multiple new nodes..
                graph = graph.replace(way.updateNode(newNode.id, connection.index));
            }
        });

        return graph;
    };


    action.connections = function(graph) {
        const candidates = [];
        let keeping = false;
        const parentWays = graph.parentWays(graph.entity(nodeId));
        let way, waynode;
        for (let i = 0; i < parentWays.length; i++) {
            way = parentWays[i];
            if (wayIds && wayIds.indexOf(way.id) === -1) {
                keeping = true;
                continue;
            }
            if (way.isArea() && (way.nodes[0] === nodeId)) {
                candidates.push({ wayID: way.id, index: 0 });
            } else {
                for (let j = 0; j < way.nodes.length; j++) {
                    waynode = way.nodes[j];
                    if (waynode === nodeId) {
                        if (way.isClosed() &&
                            parentWays.length > 1 &&
                            wayIds &&
                            wayIds.indexOf(way.id) !== -1 &&
                            j === way.nodes.length - 1) {
                            continue;
                        }
                        candidates.push({ wayID: way.id, index: j });
                    }
                }
            }
        }

        return keeping ? candidates : candidates.slice(1);
    };


    action.disabled = function(graph) {
        const connections = action.connections(graph);
        if (connections.length === 0) return 'not_connected';

        const parentWays = graph.parentWays(graph.entity(nodeId));
        const seenRelationIds = {};
        let sharedRelation;

        parentWays.forEach(function(way) {
            const relations = graph.parentRelations(way);
            relations
            .filter(relation => !disconnectableRelationTypes[relation.tags.type])
            .forEach(function(relation) {
                if (relation.id in seenRelationIds) {
                    if (wayIds) {
                        if (wayIds.indexOf(way.id) !== -1 ||
                            wayIds.indexOf(seenRelationIds[relation.id]) !== -1) {
                            sharedRelation = relation;
                        }
                    } else {
                        sharedRelation = relation;
                    }
                } else {
                    seenRelationIds[relation.id] = way.id;
                }
            });
        });

        if (sharedRelation) return 'relation';
    };


    action.limitWays = function(val) {
        if (!arguments.length) return wayIds;
        wayIds = val;
        return action;
    };


    return action;
}
