iD.modes = {};

iD.modes.Browse = function() {
    var mode = {};

    mode.enter = function() {
        mode.map.surface.on('click.browse', function () {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                mode.controller.enter(iD.modes.Select(datum));
            }
        });
    };

    mode.exit = function() {
        mode.map.surface.on('click.browse', null);
    };

    return mode;
};

iD.modes.Select = function (entity) {
    var mode = {},
        inspector = iD.Inspector(),
        dragging, target;

    var dragWay = d3.behavior.drag()
        .origin(function(entity) {
            var p = mode.map.projection(entity.nodes[0].loc);
            return { x: p[0], y: p[1] };
        })
        .on('drag', function(entity) {
            if (!mode.map.dragEnable()) return;

            d3.event.sourceEvent.stopPropagation();

            if (!dragging) {
                dragging = iD.util.trueObj([entity.id].concat(
                    _.pluck(mode.history.graph().parents(entity.id), 'id')));
                mode.history.perform(iD.actions.noop());
            }

            entity.nodes.forEach(function(node) {
                var start = mode.map.projection(node.loc);
                var end = mode.map.projection.invert([start[0] + d3.event.dx, start[1] + d3.event.dy]);
                node.loc = end;
                mode.history.replace(iD.actions.move(node, end));
            });
        })
        .on('dragend', function () {
            if (!mode.map.dragEnable() || !dragging) return;
            dragging = undefined;
            mode.map.redraw();
        });

    function remove() {
        // Remove this node from any ways that is a member of
        mode.history.graph().parents(entity.id)
            .filter(function(d) { return d.type === 'way'; })
            .forEach(function(parent) {
                mode.history.perform(iD.actions.removeWayNode(parent, entity));
            });
        mode.history.perform(iD.actions.remove(entity));
        mode.controller.exit();
    }

    mode.enter = function () {
        target = mode.map.surface.selectAll("*")
            .filter(function (d) { return d === entity; });

        d3.select('.inspector-wrap')
            .style('display', 'block')
            .datum(entity)
            .call(inspector);

        inspector.on('changeTags', function(d, tags) {
            mode.history.perform(iD.actions.changeTags(history.graph().entity(d.id), tags));
        }).on('changeWayDirection', function(d) {
            mode.history.perform(iD.actions.changeWayDirection(d));
        }).on('remove', function() {
            remove();
        }).on('close', function() {
            mode.controller.exit();
        });

        if (entity.type === 'way') {
            target.call(dragWay);
        }

        mode.map.surface.on("click.browse", function () {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                mode.controller.enter(iD.modes.Select(datum));
            } else {
                mode.controller.enter(iD.modes.Browse());
            }
        });

        mode.map.keybinding().on('⌫.browse', function(e) {
            remove();
            e.preventDefault();
        });

        mode.map.selection(entity.id);
    };

    mode.exit = function () {
        d3.select('.inspector-wrap')
            .style('display', 'none');

        if (entity.type === 'way') {
            target.on('mousedown.drag', null)
                .on('touchstart.drag', null);
        }

        mode.map.surface.on("click.browse", null);
        mode.map.keybinding().on('⌫.browse', null);

        mode.map.selection(null);
    };

    return mode;
};

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

// user has clicked on the map, started a road, and now needs to click more
// nodes to continue it.
iD.modes.DrawRoad = function(way_id, direction) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);
            this.map.dragEnable(false);

            var index = (direction === 'forward') ? undefined : -1,
                surface = this.map.surface,
                node = iD.Node({loc: this.map.mouseCoordinates()}),
                way = this.history.graph().entity(way_id),
                firstNode = way.nodes[0],
                lastNode = _.last(way.nodes);

            this.history.perform(iD.actions.addWayNode(way, node, index));

            function mousemove() {
                this.history.replace(iD.actions.addWayNode(way, node.update({loc: this.map.mouseCoordinates()}), index));
            }

            function click() {
                d3.event.stopPropagation();

                var datum = d3.select(d3.event.target).datum() || {};

                if (datum.type === 'node') {
                    if (datum.id == firstNode || datum.id == lastNode) {
                        // If this is drawing a loop and this is not the drawing
                        // end of the stick, finish the circle
                        if (direction === 'forward' && datum.id == firstNode) {
                            this.history.replace(iD.actions.addWayNode(way,
                                this.history.graph().entity(firstNode), index));
                        } else if (direction === 'backward' && datum.id == lastNode) {
                            this.history.replace(iD.actions.addWayNode(way,
                                this.history.graph().entity(lastNode), index));
                        }

                        delete way.tags.elastic;
                        this.history.perform(iD.actions.changeTags(way, way.tags));

                        // End by clicking on own tail
                        return this.controller.enter(iD.modes.Select(way));
                    } else {
                        // connect a way to an existing way
                        this.history.replace(iD.actions.addWayNode(way, datum, index));
                    }
                } else if (datum.type === 'way') {
                    node = node.update({loc: this.map.mouseCoordinates()});
                    this.history.replace(iD.actions.addWayNode(way, node, index));

                    var connectedWay = this.history.graph().entity(datum.id);
                    var connectedIndex = iD.modes.chooseIndex(datum, d3.mouse(surface.node()), this.map);
                    this.history.perform(iD.actions.addWayNode(connectedWay, node, connectedIndex));
                } else {
                    node = node.update({loc: this.map.mouseCoordinates()});
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

iD.modes.DrawArea = function(way_id) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);

            var surface = this.map.surface,
                way = this.history.graph().entity(way_id),
                firstnode_id = _.first(way.nodes),
                node = iD.Node({loc: this.map.mouseCoordinates()});

            this.history.perform(iD.actions.addWayNode(way, node));

            function mousemove() {
                this.history.replace(iD.actions.addWayNode(way, node.update({loc: this.map.mouseCoordinates()})));
            }

            function click() {
                d3.event.stopPropagation();

                var datum = d3.select(d3.event.target).datum();

                if (datum.type === 'node') {
                    if (datum.id == firstnode_id) {
                        this.history.replace(iD.actions.addWayNode(way,
                            this.history.graph().entity(way.nodes[0])));

                        delete way.tags.elastic;
                        this.history.perform(iD.actions.changeTags(way, way.tags));

                        // End by clicking on own tail
                        return this.controller.enter(iD.modes.Select(way));
                    } else {
                        // connect a way to an existing way
                        this.history.replace(iD.actions.addWayNode(way, datum));
                    }
                } else {
                    node = node.update({loc: this.map.mouseCoordinates()});
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
