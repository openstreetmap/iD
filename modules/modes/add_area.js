import { actionAddEntity } from '../actions/add_entity';
import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionAddVertex } from '../actions/add_vertex';

import { behaviorAddWay } from '../behavior/add_way';
import { modeDrawArea } from './draw_area';
import { osmNode, osmWay } from '../osm';


export function modeAddArea(context, mode) {
    mode.id = 'add-area';

    const behavior = behaviorAddWay(context)
        .on('start', start)
        .on('startFromWay', startFromWay)
        .on('startFromNode', startFromNode);

    function defaultTags(loc) {
        let defaultTags = { area: 'yes' };
        if (mode.preset) defaultTags = mode.preset.setTags(defaultTags, 'area', false, loc);
        return defaultTags;
    }

    function actionClose(wayId) {
        return function (graph) {
            return graph.replace(graph.entity(wayId).close());
        };
    }


    function start(loc) {
        const startGraph = context.graph();
        const node = osmNode({ loc: loc });
        const way = osmWay({ tags: defaultTags(loc) });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id)
        );

        context.enter(modeDrawArea(context, way.id, startGraph, mode.button));
    }


    function startFromWay(loc, edge) {
        const startGraph = context.graph();
        const node = osmNode({ loc: loc });
        const way = osmWay({ tags: defaultTags(loc) });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id),
            actionAddMidpoint({ loc: loc, edge: edge }, node)
        );

        context.enter(modeDrawArea(context, way.id, startGraph, mode.button));
    }


    function startFromNode(node) {
        const startGraph = context.graph();
        const way = osmWay({ tags: defaultTags(node.loc) });

        context.perform(
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id)
        );

        context.enter(modeDrawArea(context, way.id, startGraph, mode.button));
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    return mode;
}
