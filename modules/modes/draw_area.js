import { t } from '../core/localizer';
import { behaviorDrawWay } from '../behavior/draw_way';


export function modeDrawArea(context, wayID, startGraph, button) {
    var mode = {
        button: button,
        id: 'draw-area'
    };

    var behavior;

    mode.wayID = wayID;

    mode.enter = function() {
        var way = context.entity(wayID);

        behavior = behaviorDrawWay(context, wayID, undefined, mode, startGraph)
            .on('rejectedSelfIntersection.modeDrawArea', function() {
                context.ui().flash
                    .text(t('self_intersection.error.areas'))();
            });

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
        return [wayID];
    };


    mode.activeID = function() {
        return (behavior && behavior.activeID()) || [];
    };


    return mode;
}
