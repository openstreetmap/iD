import { actionAddEntity } from '../actions/add_entity';
import { actionAddMidpoint, type Edge } from '../actions/add_midpoint';
import { actionAddVertex } from '../actions/add_vertex';

import { behaviorAddWay } from '../behavior/add_way';
import { modeDrawArea } from './draw_area';
import { osmNode, osmWay, type WayId } from '../osm';
import { t } from '../core';
import { presetManager } from '../presets';
import type { coreContext, Mode } from '../core/context';
import type { Vec2 } from '../geo/vector';
import type { Action } from '../core/history';


export function modeAddArea(context: coreContext) {
    const mode: Mode = function() {};
    mode.title = t.append('modes.add_area.title');
    mode.button = 'area';
    mode.description = t.append('modes.add_area.description');
    mode.preset = presetManager.item('area');
    mode.key = '3';
    mode.id = 'add-area';

    var behavior = behaviorAddWay(context);
    behavior
        .on('start', start)
        .on('startFromWay', startFromWay)
        .on('startFromNode', startFromNode);

    function defaultTags(loc: Vec2) {
        var defaultTags: Tags = { area: 'yes' };
        if (mode.preset) defaultTags = mode.preset.setTags(defaultTags, 'area', false, loc);
        return defaultTags;
    }

    function actionClose(wayId: WayId): Action {
        return function (graph) {
            return graph.replace(graph.entity(wayId).close());
        };
    }


    function start(loc: Vec2) {
        var startGraph = context.graph();
        var node = new osmNode({ loc: loc });
        var way = new osmWay({ tags: defaultTags(loc) });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id)
        );

        context.enter(modeDrawArea(context, way.id, startGraph, mode.button));
    }


    function startFromWay(loc: Vec2, edge: Edge) {
        var startGraph = context.graph();
        var node = new osmNode({ loc: loc });
        var way = new osmWay({ tags: defaultTags(loc) });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id),
            actionAddMidpoint({ loc: loc, edge: edge }, node)
        );

        context.enter(modeDrawArea(context, way.id, startGraph, mode.button));
    }


    function startFromNode(node: osmNode) {
        var startGraph = context.graph();
        var way = new osmWay({ tags: defaultTags(node.loc) });

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
