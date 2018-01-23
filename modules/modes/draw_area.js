import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior';


export function modeDrawArea(context, wayId, startGraph) {
    var mode = {
        button: 'area',
        id: 'draw-area'
    };

    var behavior;


    mode.enter = function() {
        var way = context.entity(wayId);

        behavior = behaviorDrawWay(context, wayId, undefined, mode, startGraph)
            .tail(t('modes.draw_area.tail'));

        var addNode = behavior.addNode;

        behavior.addNode = function(node, d) {
            var length = way.nodes.length;
            var penultimate = length > 2 ? way.nodes[length - 2] : null;

            if (node.id === way.first() || node.id === penultimate) {
                behavior.finish();
            } else {
                addNode(node, d);
            }
        };

        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    mode.selectedIDs = function() {
        return [wayId];
    };


    mode.activeID = function() {
        return (behavior && behavior.activeID()) || [];
    };


    return mode;
}
