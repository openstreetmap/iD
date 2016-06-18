import { Draw } from '../behavior/index';
import { Node } from '../core/index';
import { Select, Browse } from './index';
import { AddEntity } from '../actions/index';
export function AddPoint(context) {
    var mode = {
        id: 'add-point',
        button: 'point',
        title: t('modes.add_point.title'),
        description: t('modes.add_point.description'),
        key: '1'
    };

    var behavior = Draw(context)
        .tail(t('modes.add_point.tail'))
        .on('click', add)
        .on('clickWay', addWay)
        .on('clickNode', addNode)
        .on('cancel', cancel)
        .on('finish', cancel);

    function add(loc) {
        var node = Node({loc: loc});

        context.perform(
            AddEntity(node),
            t('operations.add.annotation.point'));

        context.enter(
            Select(context, [node.id])
                .suppressMenu(true)
                .newFeature(true));
    }

    function addWay(loc) {
        add(loc);
    }

    function addNode(node) {
        add(node.loc);
    }

    function cancel() {
        context.enter(Browse(context));
    }

    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
}
