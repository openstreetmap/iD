import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior';


export function modeDrawLine(context, wayId, startGraph, affix) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    var behavior;


    mode.enter = function() {
        var way = context.entity(wayId);
        var index = (affix === 'prefix') ? 0 : undefined;
        var headId = (affix === 'prefix') ? way.first() : way.last();

        behavior = behaviorDrawWay(context, wayId, index, mode, startGraph)
            .tail(t('modes.draw_line.tail'));

        var addNode = behavior.addNode;
        behavior.addNode = function(node) {
            if (node.id === headId) {
                behavior.finish();
            } else {
                addNode(node);
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

    mode.activeIDs = function() {
        return (behavior && behavior.activeIDs()) || [];
    };

    return mode;
}
