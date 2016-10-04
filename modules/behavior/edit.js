export function behaviorEdit(context) {

    function edit() {
        context.map()
            .minzoom(context.minEditableZoom());
    }


    edit.off = function() {
        context.map()
            .minzoom(0);
    };


    return edit;
}
