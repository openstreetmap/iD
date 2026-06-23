import type { Action } from '../core/history';

export function actionNoop(): Action {
    return function(graph) {
        return graph;
    };
}
