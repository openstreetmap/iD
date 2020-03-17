import { t } from '../util/locale';
import { actionChangeTags } from '../actions/change_tags';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';
import { uiFlash } from '../ui/flash';


export function modeDrawLine(context, wayID, startGraph, button, affix, addMode) {
    var mode = {
        button: button,
        id: 'draw-line',
        addMode: addMode,
        affix: affix
    };

    var _behavior;

    mode.wayID = wayID;

    mode.isContinuing = !!affix;

    mode.repeatAddedFeature = function(val) {
        if (addMode) return addMode.repeatAddedFeature(val);
    };

    mode.addedEntityIDs = function() {
        if (addMode) return addMode.addedEntityIDs();
    };

    mode.enter = function() {
        mode.skipEnter = false;

        if (addMode) {
            // Add in case this draw mode was entered from somewhere besides modeAddLine.
            // Duplicates are resolved later.
            addMode.addAddedEntityID(wayID);
        }

        var way = context.entity(wayID);
        var index = (affix === 'prefix') ? 0 : undefined;
        var headID = (affix === 'prefix') ? way.first() : way.last();

        _behavior = behaviorDrawWay(context, wayID, index, startGraph)
            .tail(t('modes.draw_line.tail'))
            .on('doneSegment.modeDrawLine', function(node) {
                if (mode.defaultNodeTags && node && !Object.keys(node.tags).length) {
                    // add the default tags to the node, if any
                    context.replace(actionChangeTags(node.id, mode.defaultNodeTags), context.history().undoAnnotation());
                }
                if (mode.skipEnter) return;

                // re-enter this mode to start the next segment
                context.enter(mode);
            })
            .on('finish.modeDrawLine revert.modeDrawArea', function() {
                if (mode.skipEnter) return;

                if (mode.repeatAddedFeature()) {
                    context.enter(addMode);
                } else {
                    var newMode = modeSelect(context, mode.addedEntityIDs() || [wayID])
                        .newFeature(!mode.isContinuing);
                    context.enter(newMode);
                }
            })
            .on('rejectedSelfIntersection.modeDrawLine', function() {
                uiFlash()
                    .text(t('self_intersection.error.lines'))();
            });

        var addNode = _behavior.addNode;
        _behavior.addNode = function(node, d) {
            if (node.id === headID) {
                _behavior.finish();
            } else {
                addNode(node, d);
            }
        };

        context.install(_behavior);
    };

    mode.exit = function() {
        context.uninstall(_behavior);
    };

    // complete drawing, if possible
    mode.finish = function(skipEnter) {
        if (skipEnter) {
            mode.skipEnter = true;
        }
        return _behavior.finish();
    };

    mode.selectedIDs = function() {
        return [wayID];
    };

    mode.activeID = function() {
        return _behavior && _behavior.activeID();
    };

    return mode;
}
