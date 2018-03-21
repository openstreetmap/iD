// @flow
import type { Action, Graph, Way } from '.';

export function actionAddEntity(way: Way): Action {
    return function(graph: Graph): Graph {
        return graph.replace(way);
    };
}
