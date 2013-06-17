iD.behavior.Edit = function(context) {
    function disableTooHigh() {
        if (!context.map().editable()) {
            context.enter(iD.modes.Browse(context));
        }
    }

    function edit() {
        context.map()
            .minzoom(16);
    }

    edit.off = function() {
        context.map()
            .minzoom(0);
    };

    return edit;
};
