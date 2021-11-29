export function actionCurverize(selectedIds, projection) {

    var action = function (graph) {
        console.log('curverize');
        return graph;
    };

    action.disabled = function (graph) {

        return false;

    };

    action.transitionable = true;

    return action;
}
