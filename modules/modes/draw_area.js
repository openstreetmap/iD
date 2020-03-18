import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';
import { uiFlash } from '../ui/flash';


export function modeDrawArea(context, mode) {

    var _behavior;

    mode.id = 'draw-area';

    mode.button = mode.button || 'area';
    mode.startGraph = mode.startGraph || context.graph();
    mode.preset = mode.addMode && mode.addMode.preset;
    mode.geometry = mode.addMode ? mode.addMode.geometry : 'area';

    mode.isContinuing = function() {
        return false;
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
            // Add in case this draw mode was entered from somewhere besides modeAddArea
            mode.addMode.addAddedEntityID(mode.wayID);
        }

        var way = context.entity(mode.wayID);

        _behavior = behaviorDrawWay(context, mode.wayID, undefined, mode.startGraph)
            .tail(t('modes.draw_area.tail'))
            .on('doneSegment.modeDrawArea', function() {
                if (mode.skipEnter) return;

                // re-enter this mode to start the next segment
                context.enter(mode);
            })
            .on('finish.modeDrawArea revert.modeDrawArea', function() {
                if (mode.skipEnter) return;

                if (mode.repeatAddedFeature()) {
                    context.enter(mode.addMode);
                } else {
                    var newMode = modeSelect(context, mode.addedEntityIDs() || [mode.wayID])
                        .presets(mode.preset ? [mode.preset] : null)
                        .newFeature(true);
                    context.enter(newMode);
                }
            })
            .on('rejectedSelfIntersection.modeDrawArea', function() {
                uiFlash()
                    .text(t('self_intersection.error.areas'))();
            });

        var addNode = _behavior.addNode;

        _behavior.addNode = function(node, d) {
            var length = way.nodes.length;
            var penultimate = length > 2 ? way.nodes[length - 2] : null;

            if (node.id === way.first() || node.id === penultimate) {
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
