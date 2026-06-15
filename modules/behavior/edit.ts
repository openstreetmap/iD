export function behaviorEdit(context: iD.Context) {

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
