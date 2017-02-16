import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { uiFlash } from '../ui/index';


/* Creates a keybinding behavior for an operation */
export function behaviorOperation(context) {
    var which, keybinding;


    var behavior = function () {
        if (which && which.available() && !context.inIntro()) {
            keybinding = d3keybinding('behavior.key.' + which.id);
            keybinding.on(which.keys, function() {
                d3.event.preventDefault();
                var disabled = which.disabled();
                if (disabled) {
                    uiFlash().text(which.tooltip);
                } else {
                    var annotation = which.annotation || which.title;
                    uiFlash().text(annotation);
                    which();
                }
            });
            d3.select(document).call(keybinding);
        }
        return behavior;
    };


    behavior.off = function() {
        if (keybinding) {
            d3.select(document).call(keybinding.off);
        }
    };


    behavior.which = function (_) {
        if (!arguments.length) return which;
        which = _;
        return behavior;
    };


    return behavior;
}
