import { t } from '../core/localizer';
import { actionChangeTags } from '../actions/change_tags';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';


export function modeDrawLine(context, mode) {

    var _behavior;

    mode.id = 'draw-line';

    mode.button = mode.button || 'line';
    mode.startGraph = mode.startGraph || context.graph();
    mode.preset = mode.addMode && mode.addMode.preset;
    mode.geometry = mode.addMode ? mode.addMode.geometry : 'line';

    mode.isContinuing = function() {
        return !!mode.affix;
    };

    mode.repeatAddedFeature = function(val) {
        if (mode.addMode) return mode.addMode.repeatAddedFeature(val);
    };

    mode.addedEntityIDs = function() {
        if (mode.addMode) return mode.addMode.addedEntityIDs();
    };

    mode.enter = function() {
        mode.skipEnter = false;

        if (mode.addMode) {
            // Add in case this draw mode was entered from somewhere besides modeAddLine
            mode.addMode.addAddedEntityID(mode.wayID);
        }

        var way = context.entity(mode.wayID);
        var index = (mode.affix === 'prefix') ? 0 : undefined;
        var headID = (mode.affix === 'prefix') ? way.first() : way.last();

        _behavior = behaviorDrawWay(context, mode.wayID, index, mode.startGraph)
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
                    context.enter(mode.addMode);
                } else {
                    var newMode = modeSelect(context, mode.addedEntityIDs() || [mode.wayID])
                        .presets(mode.preset ? [mode.preset] : null)
                        .newFeature(!mode.isContinuing());
                    context.enter(newMode);
                }
            })
            .on('rejectedSelfIntersection.modeDrawLine', function() {
                context.ui().flash
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
        return [mode.wayID];
    };

    mode.activeID = function() {
        return _behavior && _behavior.activeID();
    };

    return mode;
}
