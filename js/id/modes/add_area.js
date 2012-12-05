iD.modes.AddArea = {
    id: 'add-area',
    title: '+ Area',

    way: function() {
        return iD.Way({
            tags: { building: 'yes', area: 'yes', elastic: 'true' }
        });
    },

    enter: function() {
        this.map.dblclickEnable(false);

        var surface = this.map.surface;

        function click() {
            var datum = d3.select(d3.event.target).datum() || {},
                node, way = this.way();

            // connect a way to an existing way
            if (datum.type === 'node') {
                node = datum;
            } else {
                node = iD.Node({loc: this.map.mouseCoordinates()});
            }

            this.history.perform(iD.actions.startWay(way));
            this.history.perform(iD.actions.addWayNode(way, node));

            this.controller.enter(iD.modes.DrawArea(way.id));
        }

        surface.on('click.addarea', click.bind(this));

        this.map.keybinding().on('⎋.exit', function() {
            this.controller.exit();
        }.bind(this));
    },

    exit: function() {
        window.setTimeout(function() {
            this.map.dblclickEnable(true);
        }.bind(this), 1000);
        this.map.surface.on('click.addarea', null);
        this.map.keybinding().on('⎋.exit', null);
    }
};
