iD.behavior.accept = function() {
    var event = d3.dispatch('accept'),
        keybinding = d3.keybinding('accept');

    function accept(selection) {
        keybinding.on('↩', function() {
            event.accept();
        })(selection);
    }

    return d3.rebind(accept, event, "on");
};
