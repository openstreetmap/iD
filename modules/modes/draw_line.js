import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/index';

export function modeDrawLine(context, wayId, baseGraph, affix) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    var behavior;


    mode.enter = function() {
        var way = context.entity(wayId),
            index = (affix === 'prefix') ? 0 : undefined,
            headId = (affix === 'prefix') ? way.first() : way.last();

        behavior = behaviorDrawWay(context, wayId, index, mode, baseGraph)
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


    return mode;
}
