import { t } from '../util/locale';
import { AddEntity, AddMidpoint, AddVertex } from '../actions/index';
import { Node, Way } from '../core/index';
import { AddWay } from '../behavior/index';
import { DrawLine } from './index';

export function AddLine(context) {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: t('modes.add_line.title'),
        description: t('modes.add_line.description'),
        key: '2'
    };

    var behavior = AddWay(context)
        .tail(t('modes.add_line.tail'))
        .on('start', start)
        .on('startFromWay', startFromWay)
        .on('startFromNode', startFromNode);

    function start(loc) {
        var baseGraph = context.graph(),
            node = Node({loc: loc}),
            way = Way();

        context.perform(
            AddEntity(node),
            AddEntity(way),
            AddVertex(way.id, node.id));

        context.enter(DrawLine(context, way.id, baseGraph));
    }

    function startFromWay(loc, edge) {
        var baseGraph = context.graph(),
            node = Node({loc: loc}),
            way = Way();

        context.perform(
            AddEntity(node),
            AddEntity(way),
            AddVertex(way.id, node.id),
            AddMidpoint({ loc: loc, edge: edge }, node));

        context.enter(DrawLine(context, way.id, baseGraph));
    }

    function startFromNode(node) {
        var baseGraph = context.graph(),
            way = Way();

        context.perform(
            AddEntity(way),
            AddVertex(way.id, node.id));

        context.enter(DrawLine(context, way.id, baseGraph));
    }

    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
}
