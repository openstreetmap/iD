import { t } from '../util/locale';
import {
    actionAddEntity,
    actionAddMidpoint,
    actionAddVertex
} from '../actions';

import { behaviorAddWay } from '../behavior';
import { modeDrawArea } from './index';
import { osmNode, osmWay } from '../osm';


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
        .on('startFromNode', startFromNode);

    var defaultTags = { area: 'yes' };


    function actionClose(wayId) {
        return function (graph) {
            return graph.replace(graph.entity(wayId).close());
        };
    }


    function start(loc) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id)
        );

        context.enter(modeDrawArea(context, way.id, startGraph));
    }


    function startFromWay(loc, edge) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id),
            actionAddMidpoint({ loc: loc, edge: edge }, node)
        );

        context.enter(modeDrawArea(context, way.id, startGraph));
    }


    function startFromNode(node) {
        var startGraph = context.graph();
        var way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id)
        );

        context.enter(modeDrawArea(context, way.id, startGraph));
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    return mode;
}
