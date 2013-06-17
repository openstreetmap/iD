iD.behavior.Edit = function(context) {
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
