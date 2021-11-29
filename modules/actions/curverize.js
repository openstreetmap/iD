export function actionCurverize(selectedIds, projection) {

    var action = function (graph) {

        let way = null;
        let lastNode = null;
        const entities = selectedIds.map(function (selectedID) {
            return graph.entity(selectedID);
        });

        if (selectedIds.length === 2 && entities[0].type === 'way' && entities[1].type === 'node') {
            way = entities[0];
            lastNode = entities[1];
        } else if (selectedIds.length === 1 && entities[0].type === 'node') {
            const nodeParentWays = graph.parentWays(entities[0]);
            way = nodeParentWays[0];
            lastNode = entities[0];
        }
        const lastNodeIdx = way.nodes.indexOf(lastNode.id);

        let lastFourNodes = [];
        if (lastNodeIdx === 0) {
            lastFourNodes = [way.nodes[3], way.nodes[2], way.nodes[1], way.nodes[0]];
        } else if (lastNodeIdx === way.nodes.length - 1) {
            lastFourNodes = [way.nodes[way.nodes.length - 4], way.nodes[way.nodes.length - 3], way.nodes[way.nodes.length - 2], way.nodes[way.nodes.length - 1]];
        }
        console.log('lastFourNodes', lastFourNodes);
        return graph;
    };

    action.disabled = function (graph) {

        return false;

    };

    action.transitionable = true;

    return action;
}
