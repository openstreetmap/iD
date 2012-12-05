iD.modes.AddRoad = {
    id: 'add-road',
    title: '+ Road',

    enter: function() {
        this.map.dblclickEnable(false);
        var surface = this.map.surface;

        // http://bit.ly/SwUwIL
        // http://bit.ly/WxqGng
        function click() {
            var datum = d3.select(d3.event.target).datum() || {},
                node,
                direction = 'forward',
                start = true,
                way = iD.Way({ tags: { highway: 'residential', elastic: 'true' } });

            if (datum.type === 'node') {
                // continue an existing way
                node = datum;

                var id = datum.id;
                var parents = this.history.graph().parents(id);
                if (parents.length) {
                    if (parents[0].nodes[0] === id) {
                        way = parents[0];
                        direction = 'backward';
                        start = false;
                    } else if (_.last(parents[0].nodes) === id) {
                        way = parents[0];
                        start = false;
                    }
                }
            } else if (datum.type === 'way') {
                // begin a new way starting from an existing way
                node = iD.Node({loc: this.map.mouseCoordinates()});

                var index = iD.util.geo.chooseIndex(datum, d3.mouse(surface.node()), this.map);
                var connectedWay = this.history.graph().entity(datum.id);
                this.history.perform(iD.actions.addWayNode(connectedWay, node, index));
            } else {
                // begin a new way
                node = iD.Node({loc: this.map.mouseCoordinates()});
            }

            if (start) {
                this.history.perform(iD.actions.startWay(way));
                this.history.perform(iD.actions.addWayNode(way, node));
            }

            this.controller.enter(iD.modes.DrawRoad(way.id, direction));
        }

        surface.on('click.addroad', click.bind(this));

        this.map.keybinding().on('⎋.exit', function() {
            this.controller.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.dblclickEnable(true);
        this.map.surface.on('click.addroad', null);
        this.map.keybinding().on('⎋.exit', null);
        d3.selectAll('#addroad').remove();
    }
};
