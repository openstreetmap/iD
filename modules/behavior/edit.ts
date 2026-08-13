import type { coreContext } from '../core';

export function behaviorEdit(context: coreContext) {

    function behavior() {
        context.map()
            .minzoom(context.minEditableZoom());
    }


    behavior.off = function() {
        context.map()
            .minzoom(0);
    };

    return behavior;
}
