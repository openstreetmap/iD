import { t } from '../util/locale';
import { actionAddEntity } from '../actions/add_entity';
import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionAddVertex } from '../actions/add_vertex';

import { behaviorAddWay } from '../behavior/add_way';
import { modeBrowse } from './browse';
import { modeDrawArea } from './draw_area';
import { modeSelect } from './select';
import { osmNode, osmWay } from '../osm';


export function modeAddArea(context, mode) {
    mode.id = 'add-area';

    var _baselineGraph = context.graph();

    var _behavior = behaviorAddWay(context)
        .tail(t('modes.add_area.tail'))
        .on('start', start)
        .on('startFromWay', startFromWay)
        .on('startFromNode', startFromNode)
        .on('cancel', function() {
            context.enter(modeBrowse(context));
        })
        .on('finish', function() {
            mode.finish();
        });

    mode.defaultTags = { area: 'yes' };
    if (mode.preset) mode.defaultTags = mode.preset.setTags(mode.defaultTags, 'area');

    var _repeatAddedFeature = false;
    var _allAddedEntityIDs = [];

    mode.repeatAddedFeature = function(val) {
        if (!arguments.length || val === undefined) return _repeatAddedFeature;
        _repeatAddedFeature = val;
        return mode;
    };

    mode.addedEntityIDs = function() {
        return _allAddedEntityIDs.filter(function(id) {
            return context.hasEntity(id);
        });
    };

    mode.addAddedEntityID = function(entityID) {
        if (_allAddedEntityIDs.indexOf(entityID) === -1) {
            _allAddedEntityIDs.push(entityID);
        }
    };

    function actionClose(wayId) {
        return function (graph) {
            return graph.replace(graph.entity(wayId).close());
        };
    }

    function start(loc) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay({ tags: mode.defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id)
        );

        enterDrawMode(way, startGraph);
    }

    function startFromWay(loc, edge) {
        var startGraph = context.graph();
        var node = osmNode({ loc: loc });
        var way = osmWay({ tags: mode.defaultTags });

        context.perform(
            actionAddEntity(node),
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id),
            actionAddMidpoint({ loc: loc, edge: edge }, node)
        );

        enterDrawMode(way, startGraph);
    }

    function startFromNode(node) {
        var startGraph = context.graph();
        var way = osmWay({ tags: mode.defaultTags });

        context.perform(
            actionAddEntity(way),
            actionAddVertex(way.id, node.id),
            actionClose(way.id)
        );

        enterDrawMode(way, startGraph);
    }

    function enterDrawMode(way, startGraph) {
        _allAddedEntityIDs.push(way.id);
        var drawMode = modeDrawArea(context, {
            wayID: way.id,
            startGraph: startGraph,
            button: mode.button,
            addMode: mode
        });
        context.enter(drawMode);
    }

    mode.finish = function() {
        if (mode.addedEntityIDs().length) {
            context.enter(
                modeSelect(context, mode.addedEntityIDs())
                    .presets(mode.preset ? [mode.preset] : null)
                    .newFeature(true)
            );
        } else {
            context.enter(
                modeBrowse(context)
            );
        }
    };

    function undone() {
        if (context.graph() === _baselineGraph || mode.addedEntityIDs().length === 0) {
            context.enter(modeBrowse(context));
        }
    }

    mode.enter = function() {
        context.install(_behavior);
        context.history()
            .on('undone.add_area', undone);
    };

    mode.exit = function() {
        context.history()
            .on('undone.add_area', null);
        context.uninstall(_behavior);
    };

    return mode;
}
