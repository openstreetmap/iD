import { actionDeleteNode } from './delete_node';
import { actionDeleteRelation } from './delete_relation';
import { actionDeleteWay } from './delete_way';


export function actionDeleteMultiple(ids) {
    var actions = {
        way: actionDeleteWay,
        node: actionDeleteNode,
        relation: actionDeleteRelation
    };


    var action = function(graph) {
        ids.forEach(function(id) {
            if (graph.hasEntity(id)) { // It may have been deleted aready.
                graph = actions[graph.entity(id).type](id)(graph);
            }
        });

        return graph;
    };


    action.disabled = function(graph) {
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i],
                disabled = actions[graph.entity(id).type](id).disabled(graph);
            if (disabled) return disabled;
        }
    };


    return action;
}
