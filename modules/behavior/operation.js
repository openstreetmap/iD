import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';


/* Creates a keybinding behavior for an operation */
export function behaviorOperation(context) {
    var which, keybinding;


    var behavior = function () {
        if (which) {
            keybinding = d3keybinding('behavior.key.' + which.id);
            keybinding.on(which.keys, function() {
                d3.event.preventDefault();
                if (!(context.inIntro() || which.disabled())) {
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
