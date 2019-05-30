import { t } from '../util/locale';
import { actionAddEntity } from '../actions/add_entity';
import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionAddVertex } from '../actions/add_vertex';

import { behaviorAddWay } from '../behavior/add_way';
import { modeDrawLine } from './draw_line';
import { osmNode, osmWay } from '../osm';


export function modeAddLine(context, mode) {
    mode.id = 'add-line';
    mode.repeatCount = 0;

    var behavior = behaviorAddWay(context)
        .tail(t('modes.add_line.tail'))
        .on('start', start)
        .on('startFromWay', startFromWay)
        .on('startFromNode', startFromNode);

    var defaultTags = {};
    if (mode.preset) defaultTags = mode.preset.setTags(defaultTags, 'line');


    function start(loc) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id)
        );

        enterDrawMode(way, startGraph);
    }


    function startFromWay(loc, edge) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionAddMidpoint({ loc: loc, edge: edge }, node)
        );

        enterDrawMode(way, startGraph);
    }


    function startFromNode(node) {
        var startGraph = context.graph();
        var way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(way),
            actionAddVertex(way.id, node.id)
        );

        enterDrawMode(way, startGraph);
    }


    function enterDrawMode(way, startGraph) {
        var drawMode = modeDrawLine(context, way.id, startGraph, context.graph(), mode.button, null, mode);
        drawMode.repeatAddedFeature = mode.repeatAddedFeature;
        drawMode.repeatCount = mode.repeatCount;
        drawMode.title = mode.title;
        context.enter(drawMode);
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
}
