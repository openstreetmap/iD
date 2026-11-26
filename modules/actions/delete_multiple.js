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
            if (graph.hasEntity(id)) { // It may have been deleted already.
                graph = actions[graph.entity(id).type](id)(graph);
            }
        });

        return graph;
    };


    return action;
}
