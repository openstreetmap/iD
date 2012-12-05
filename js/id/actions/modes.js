iD.modes = {};

iD.modes._node = function(ll) {
    return iD.Node({loc: ll});
};


iD.modes.AddPlace = {
    id: 'add-place',
    title: '+ Place',

    enter: function() {
        var surface = this.map.surface;

        function click() {
            var ll = this.map.projection.invert(
                d3.mouse(surface.node()));
            var n = iD.modes._node(ll);
            n._poi = true;
            this.history.perform(iD.actions.addNode(n));
            this.map.selectEntity(n);
            this.controller.exit();
            this.exit();
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

iD.modes.AddRoad = {
    id: 'add-road',
    title: '+ Road',

    enter: function() {
        this.map.dblclickEnable(false);
        var surface = this.map.surface;

        // http://bit.ly/SwUwIL
        // http://bit.ly/WxqGng
        function click() {
            var t = d3.select(d3.event.target),
                node,
                direction = 'forward',
                start = true,
                way = iD.Way({ tags: { highway: 'residential', elastic: 'true' } });

            // connect a way to an existing way
            if (t.datum() && t.datum().type === 'node') {
                // continue an existing way
                var id = t.datum().id;
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
                node = t.datum();
            // snap into an existing way
            } else if (t.data() && t.datum() && t.datum().type === 'way') {
                var index = iD.util.geo.chooseIndex(t.datum(), d3.mouse(surface.node()), this.map);
                node = iD.modes._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
                var connectedWay = this.history.graph().entity(t.datum().id);
                this.history.perform(iD.actions.addWayNode(connectedWay, node, index));
            } else {
                node = iD.modes._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
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

// user has clicked on the map, started a road, and now needs to click more
// nodes to continue it.
iD.modes.DrawRoad = function(way_id, direction) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);
            this.map.dragEnable(false);

            var index = (direction === 'forward') ? undefined : -1,
                pop = (direction === 'forward') ? 'pop' : 'shift',
                surface = this.map.surface,
                nextnode = iD.modes._node([NaN, NaN]),
                nextnode_id = nextnode.id,
                way = this.history.graph().entity(way_id),
                firstNode = way.nodes[0],
                lastNode = _.last(way.nodes);

            this.history.perform(iD.actions.addWayNode(way, nextnode, index));

            function mousemove() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var node = iD.Entity(this.history.graph().entity(nextnode_id), {loc: ll});
                this.history.replace(iD.actions.addWayNode(way, node, index));
            }

            function click() {
                d3.event.stopPropagation();

                var node,
                    t = d3.select(d3.event.target);

                if (t.datum() && t.datum().type === 'node') {
                    if (t.datum().id == firstNode || t.datum().id == lastNode) {
                        // If this is drawing a loop and this is not the drawing
                        // end of the stick, finish the circle
                        if (direction === 'forward' && t.datum().id == firstNode) {
                            this.history.replace(iD.actions.addWayNode(way,
                                this.history.graph().entity(firstNode), index));
                        } else if (direction === 'backward' && t.datum().id == lastNode) {
                            this.history.replace(iD.actions.addWayNode(way,
                                this.history.graph().entity(lastNode), index));
                        }

                        delete way.tags.elastic;
                        this.history.perform(iD.actions.changeTags(way, way.tags));
                        this.map.selectEntity(way);

                        // End by clicking on own tail
                        return this.controller.exit();
                    } else {
                        // connect a way to an existing way
                        node = t.datum();
                        this.history.replace(iD.actions.addWayNode(way, node, index));
                    }
                } else if (t.datum() && t.datum().type === 'way') {
                    var connectedIndex = iD.modes.chooseIndex(t.datum(), d3.mouse(surface.node()), this.map);
                    node = iD.modes._node(this.map.projection.invert(
                        d3.mouse(surface.node())));
                    this.history.replace(iD.actions.addWayNode(way, node, index));

                    var connectedWay = this.history.graph().entity(t.datum().id);
                    this.history.perform(iD.actions.addWayNode(connectedWay, node, connectedIndex));
                } else {
                    node = iD.modes._node(this.map.projection.invert(
                        d3.mouse(surface.node())));
                    this.history.replace(iD.actions.addWayNode(way, node, index));
                }

                this.controller.enter(iD.modes.DrawRoad(way_id, direction));
            }

            surface.on('mousemove.drawroad', mousemove.bind(this))
                .on('click.drawroad', click.bind(this));
                
            this.map.keybinding().on('⎋.exit', function() {
                this.controller.exit();
            }.bind(this));
        },

        exit: function() {
            this.map.surface.on('mousemove.drawroad', null)
                .on('click.drawroad', null);
            this.map.keybinding().on('⎋.exit', null);
            window.setTimeout(function() {
                this.map.dblclickEnable(true);
                this.map.dragEnable(true);
            }.bind(this), 1000);
        }
    };
};

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
            var t = d3.select(d3.event.target),
                node, way = this.way();

            // connect a way to an existing way
            if (t.datum() && t.datum().type === 'node') {
                node = t.datum();
            } else {
                node = iD.modes._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
            }

            this.history.perform(iD.actions.startWay(way));
            this.history.perform(iD.actions.addWayNode(way, node));
            this.map.selectEntity(way);
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

iD.modes.DrawArea = function(way_id) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);

            var surface = this.map.surface,
                way = this.history.graph().entity(way_id),
                firstnode_id = _.first(way.nodes),
                nextnode = iD.modes._node([NaN, NaN]),
                nextnode_id = nextnode.id;

            this.history.perform(iD.actions.addWayNode(way, nextnode));

            function mousemove() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var node = iD.Entity(this.history.graph().entity(nextnode_id), {loc: ll});
                this.history.replace(iD.actions.addWayNode(way, node));
            }

            function click() {
                d3.event.stopPropagation();

                var node,
                    t = d3.select(d3.event.target);

                if (t.datum() && t.datum().type === 'node') {
                    if (t.datum().id == firstnode_id) {
                        this.history.replace(iD.actions.addWayNode(way,
                            this.history.graph().entity(way.nodes[0])));

                        delete way.tags.elastic;
                        this.history.perform(iD.actions.changeTags(way, way.tags));

                        // End by clicking on own tail
                        return this.controller.exit();
                    } else {
                        // connect a way to an existing way
                        node = t.datum();
                        this.history.replace(iD.actions.addWayNode(way, node));
                    }
                } else {
                    node = iD.modes._node(this.map.projection.invert(
                        d3.mouse(surface.node())));
                    this.history.replace(iD.actions.addWayNode(way, node));
                }

                this.controller.enter(iD.modes.DrawArea(way_id));
            }
            
            this.map.keybinding().on('⎋.exit', function() {
                this.controller.exit();
            }.bind(this));

            surface.on('click.drawarea', click.bind(this))
                .on('mousemove.drawarea', mousemove.bind(this));
        },

        exit: function() {
            this.map.surface.on('mousemove.drawarea', null)
                .on('click.drawarea', null);
            this.map.keybinding().on('⎋.exit', null);
            window.setTimeout(function() {
                this.map.dblclickEnable(true);
            }.bind(this), 1000);
        }
    };
};

iD.modes.Move = {
    enter: function() { },
    exit: function() { }
};
