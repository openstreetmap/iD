import { t } from '../util/locale';
import {
    actionAddEntity,
    actionAddMidpoint,
    actionAddVertex
} from '../actions/index';

import { behaviorAddWay } from '../behavior/index';
import { modeDrawArea } from './index';
import { osmNode, osmWay } from '../osm/index';


export function modeAddArea(context) {
    var mode = {
        id: 'add-area',
        button: 'area',
        title: t('modes.add_area.title'),
        description: t('modes.add_area.description'),
        key: '3'
    };

    var behavior = behaviorAddWay(context)
            .tail(t('modes.add_area.tail'))
            .on('start', start)
            .on('startFromWay', startFromWay)
            .on('startFromNode', startFromNode),
        defaultTags = { area: 'yes' };


    function start(loc) {
        var graph = context.graph(),
            node = osmNode({ loc: loc }),
            way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionAddVertex(way.id, node.id)
        );

        context.enter(modeDrawArea(context, way.id, graph));
    }


    function startFromWay(loc, edge) {
        var graph = context.graph(),
            node = osmNode({ loc: loc }),
            way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionAddVertex(way.id, node.id),
            actionAddMidpoint({ loc: loc, edge: edge }, node)
        );

        context.enter(modeDrawArea(context, way.id, graph));
    }


    function startFromNode(node) {
        var graph = context.graph(),
            way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionAddVertex(way.id, node.id)
        );

        context.enter(modeDrawArea(context, way.id, graph));
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    return mode;
}
