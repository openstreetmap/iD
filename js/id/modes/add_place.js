iD.modes.AddPlace = {
    id: 'add-place',
    title: '+ Place',

    enter: function() {
        var surface = this.map.surface;

        function click() {
            var node = iD.Node({loc: this.map.mouseCoordinates(), _poi: true});
            this.history.perform(iD.actions.addNode(node));
            this.controller.enter(iD.modes.Select(node));
        }

        surface.on('click.addplace', click.bind(this));

        this.map.keybinding().on('⎋.exit', function() {
            this.controller.exit();
        }.bind(this));
    },

    exit: function() {
        this.map.surface
            .on('click.addplace', null);
        this.map.keybinding().on('⎋.exit', null);
    }
};
