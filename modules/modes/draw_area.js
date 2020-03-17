import { t } from '../util/locale';
import { behaviorDrawWay } from '../behavior/draw_way';
import { modeSelect } from './select';
import { uiFlash } from '../ui/flash';


export function modeDrawArea(context, wayID, startGraph, button, addMode) {
    var mode = {
        button: button,
        id: 'draw-area',
        addMode: addMode
    };

    var _behavior;

    mode.wayID = wayID;

    mode.repeatAddedFeature = function(val) {
        if (addMode) return addMode.repeatAddedFeature(val);
    };

    mode.addedEntityIDs = function() {
        if (addMode) return addMode.addedEntityIDs();
    };

    mode.enter = function() {
        mode.skipEnter = false;

        if (addMode) {
            // Add in case this draw mode was entered from somewhere besides modeAddArea.
            // Duplicates are resolved later.
            addMode.addAddedEntityID(wayID);
        }

        var way = context.entity(wayID);

        _behavior = behaviorDrawWay(context, wayID, undefined, startGraph)
            .tail(t('modes.draw_area.tail'))
            .on('doneSegment.modeDrawArea', function() {
                if (mode.skipEnter) return;

                // re-enter this mode to start the next segment
                context.enter(mode);
            })
            .on('finish.modeDrawArea revert.modeDrawArea', function() {
                if (mode.skipEnter) return;

                if (mode.repeatAddedFeature()) {
                    context.enter(addMode);
                } else {
                    var newMode = modeSelect(context, mode.addedEntityIDs() || [wayID])
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
        return [wayID];
    };

    mode.activeID = function() {
        return _behavior && _behavior.activeID();
    };

    return mode;
}
