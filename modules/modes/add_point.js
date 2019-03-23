import { t } from '../util/locale';
import { actionAddEntity, actionChangeTags } from '../actions';
import { behaviorDraw } from '../behavior';
import { modeBrowse, modeSelect } from './index';
import { osmNode } from '../osm';
import { actionAddMidpoint } from '../actions';


export function modeAddPoint(context, mode) {

    mode.id = 'add-point';

    var behavior = behaviorDraw(context)
        .tail(t('modes.add_point.tail'))
        .on('click', add)
        .on('clickWay', addWay)
        .on('clickNode', addNode)
        .on('cancel', cancel)
        .on('finish', cancel);

    var defaultTags = {};
    if (mode.preset) defaultTags = mode.preset.setTags(defaultTags, 'point');


    function add(loc) {
        var node = osmNode({ loc: loc, tags: defaultTags });

        context.perform(
            actionAddEntity(node),
            t('operations.add.annotation.point')
        );

        enterSelectMode(node);
    }


    function addWay(loc, edge) {
        var node = osmNode({ tags: defaultTags });

        context.perform(
            actionAddMidpoint({loc: loc, edge: edge}, node),
            t('operations.add.annotation.vertex')
        );

        enterSelectMode(node);
    }

    function enterSelectMode(node) {
        context.enter(
            modeSelect(context, [node.id]).newFeature(mode.preset.isFallback())
        );
    }


    function addNode(node) {
        if (Object.keys(defaultTags).length === 0) {
            enterSelectMode(node);
            return;
        }

        var tags = Object.assign({}, node.tags);  // shallow copy
        for (var key in defaultTags) {
            tags[key] = defaultTags[key];
        }

        context.perform(
            actionChangeTags(node.id, tags),
            t('operations.add.annotation.point')
        );

        enterSelectMode(node);
    }


    function cancel() {
        context.enter(modeBrowse(context));
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    return mode;
}
