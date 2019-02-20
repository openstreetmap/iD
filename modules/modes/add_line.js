import { t } from '../util/locale';
import {
    actionAddEntity,
    actionAddMidpoint,
    actionAddVertex
} from '../actions';

import { behaviorAddWay } from '../behavior';
import { modeDrawLine } from './index';
import { osmNode, osmWay } from '../osm';


export function modeAddLine(context, customMode, preset) {
    var mode = customMode || {
        id: 'add-line',
        button: 'line',
        title: t('modes.add_line.title'),
        description: t('modes.add_line.description'),
        key: '2'
    };

    var behavior = behaviorAddWay(context)
        .tail(t('modes.add_line.tail'))
        .on('start', start)
        .on('startFromWay', startFromWay)
        .on('startFromNode', startFromNode);

    var defaultTags = {};
    if (preset) defaultTags = preset.setTags(defaultTags, 'line');


    function start(loc) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay({ tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id)
        );

        context.enter(modeDrawLine(context, way.id, startGraph, context.graph(), mode.button));
    }


    function startFromWay(loc, edge) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay();

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionAddMidpoint({ loc: loc, edge: edge }, node)
        );

        context.enter(modeDrawLine(context, way.id, startGraph, context.graph(), mode.button));
    }


    function startFromNode(node) {
        var startGraph = context.graph();
        var way = osmWay();

        context.perform(
            actionAddEntity(way),
            actionAddVertex(way.id, node.id)
        );

        context.enter(modeDrawLine(context, way.id, startGraph, context.graph(), mode.button));
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
}
