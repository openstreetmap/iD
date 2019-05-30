import { t } from '../util/locale';
import { behaviorDraw } from '../behavior/draw';
import { modeBrowse } from './browse';
import { modeSelect } from './select';
import { osmNode } from '../osm/node';
import { actionAddEntity } from '../actions/add_entity';
import { actionChangeTags } from '../actions/change_tags';
import { actionAddMidpoint } from '../actions/add_midpoint';


export function modeAddPoint(context, mode) {

    mode.id = 'add-point';
    mode.repeatCount = 0;

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

        didFinishAdding(node);
    }


    function addWay(loc, edge) {
        var node = osmNode({ tags: defaultTags });

        context.perform(
            actionAddMidpoint({loc: loc, edge: edge}, node),
            t('operations.add.annotation.vertex')
        );

        didFinishAdding(node);
    }

    function addNode(node) {
        if (Object.keys(defaultTags).length === 0) {
            didFinishAdding(node);
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

        didFinishAdding(node);
    }

    function didFinishAdding(node) {
        if (mode.repeatAddedFeature) {
            mode.repeatCount += 1;
        } else {
            context.enter(
                modeSelect(context, [node.id]).newFeature(true)
            );
        }
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
