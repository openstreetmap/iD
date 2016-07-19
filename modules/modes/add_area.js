import { t } from '../util/locale';
import { AddEntity, AddMidpoint, AddVertex } from '../actions/index';
import { Node, Way } from '../core/index';
import { AddWay } from '../behavior/index';
import { DrawArea } from './index';

export function AddArea(context) {
    var mode = {
        id: 'add-area',
        button: 'area',
        title: t('modes.add_area.title'),
        description: t('modes.add_area.description'),
        key: '3'
    };

    var behavior = AddWay(context)
            .tail(t('modes.add_area.tail'))
            .on('start', start)
            .on('startFromWay', startFromWay)
            .on('startFromNode', startFromNode),
        defaultTags = {area: 'yes'};

    function start(loc) {
        var graph = context.graph(),
            node = Node({loc: loc}),
            way = Way({tags: defaultTags});

        context.perform(
            AddEntity(node),
            AddEntity(way),
            AddVertex(way.id, node.id),
            AddVertex(way.id, node.id));

        context.enter(DrawArea(context, way.id, graph));
    }

    function startFromWay(loc, edge) {
        var graph = context.graph(),
            node = Node({loc: loc}),
            way = Way({tags: defaultTags});

        context.perform(
            AddEntity(node),
            AddEntity(way),
            AddVertex(way.id, node.id),
            AddVertex(way.id, node.id),
            AddMidpoint({ loc: loc, edge: edge }, node));

        context.enter(DrawArea(context, way.id, graph));
    }

    function startFromNode(node) {
        var graph = context.graph(),
            way = Way({tags: defaultTags});

        context.perform(
            AddEntity(way),
            AddVertex(way.id, node.id),
            AddVertex(way.id, node.id));

        context.enter(DrawArea(context, way.id, graph));
    }

    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
}
