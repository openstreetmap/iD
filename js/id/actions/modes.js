iD.modes = {};

// Modes are entered by bindings to clicks and keypresses, and exited by the same.
//
// Modes aim to include a bare minimum of 'business logic' - this is separated
// into actions.

iD.modes._node = function(ll) {
    return iD.Node({
        lat: ll[1],
        lon: ll[0]
    });
};

iD.modes.AddPlace = {
    title: "+ Place",
    enter: function() {
        var surface = this.map.surface,
            teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addplace');

        teaser.append('circle').attr({ 'class': 'handle', r: 3 });

        surface.on('mousemove.addplace', function() {
            teaser.attr('transform', function() {
                var off = d3.mouse(surface.node());
                return 'translate(' + off + ')';
            });
        });

        surface.on('click.addplace', function() {
            var ll = this.map.projection.invert(
                d3.mouse(surface.node()));
            var n = iD.modes._node(ll);
            n._poi = true;
            this.map.perform(iD.actions.addNode(n));
            this.map.selectClick(n);
            this.exit();
        }.bind(this));

        d3.select(document).on('keydown.addplace', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.surface
            .on('mousemove.addplace', null)
            .on('click.addplace', null);
        d3.select(document).on('keydown.addplace', null);
        d3.selectAll('#addplace').remove();
    }
};

// user has clicked 'add road' or pressed a keybinding, and now has
// a teaser node and needs to click on the map to start a road
iD.modes.AddRoad = {
    title: "+ Road",
    way: function() {
        return iD.Way({ tags: { highway: 'residential' } });
    },
    enter: function() {
        this.map.dblclickEnable(false);
        var surface = this.map.surface,
            teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addroad');

        teaser.append('circle')
            .attr({ 'class': 'handle', r: 3 })
            .style('pointer-events', 'none');

        surface.on('mousemove.addroad', function() {
            teaser.attr('transform', function() {
                var off = d3.mouse(surface.node());
                return 'translate(' + off + ')';
            });
        });

        function addRoad() {
            var t = d3.select(d3.event.target),
                node,
                way = this.way();

            // connect a way to an existing way
            if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                node = t.data()[0];
            } else {
                node = iD.modes._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
            }

            this.map.perform(iD.actions.startWay(way));
            way.nodes.push(node.id);
            this.map.perform(iD.actions.addWayNode(way, node));
            this.map.selectClick(way);
            this.controller.enter(iD.modes.DrawRoad(way.id));
        }

        surface.on('click.addroad', addRoad.bind(this));

        d3.select(document).on('keydown.addroad', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.dblclickEnable(true);
        this.map.surface.on('click.addroad', null)
            .on('mousemove.addroad', null);
        d3.select(document).on('keydown.addroad', null);
        d3.selectAll('#addroad').remove();
    }
};

// user has clicked on the map, started a road, and now needs to click more
// nodes to continue it.
iD.modes.DrawRoad = function(way_id) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);
            var surface = this.map.surface,

            nextnode = iD.modes._node([NaN, NaN]);
            var nextnode_id = nextnode.id;

            var way = this.map.history.graph().entity(way_id);
            var lastnode_id = _.last(way.nodes);
            way.nodes.push(nextnode_id);
            this.map.perform(iD.actions.addWayNode(way, nextnode));

            surface.on('mousemove.drawroad', function() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var way = this.map.history.graph().entity(way_id);
                var node = iD.Entity(this.map.history.graph().entity(nextnode_id), {
                    lon: ll[0],
                    lat: ll[1]
                });
                this.map.history.replace(iD.actions.addWayNode(way, node));
                var only = iD.Util.trueObj([way.id].concat(_.pluck(way.nodes, 'id')));
                this.map.redraw(only);
            }.bind(this));

            function drawRoad() {
                var t = d3.select(d3.event.target);
                d3.event.stopPropagation();
                if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                    if (t.data()[0].id == lastnode_id) {
                        var l = this.map.history.graph().entity(way.nodes.pop());
                        this.map.perform(iD.actions.removeWayNode(way, l));
                        // End by clicking on own tail
                        return this.exit();
                    } else {
                        // connect a way to an existing way
                        node = t.data()[0];
                    }
                } else {
                    node = iD.modes._node(this.map.projection.invert(
                        d3.mouse(surface.node())));
                }
                way.nodes.pop();
                way.nodes.push(node.id);
                this.map.perform(iD.actions.addWayNode(way, node));
                way.nodes = way.nodes.slice();
                this.controller.enter(iD.modes.DrawRoad(way_id));
            }

            surface.on('click.drawroad', drawRoad.bind(this));
        },
        exit: function() {
            this.map.surface.on('mousemove.drawroad', null)
                .on('click.drawroad', null);
            d3.select(document).on('.drawroad', null);
            d3.selectAll('#drawroad').remove();
            window.setTimeout(function() {
                this.map.dblclickEnable(true);
            }.bind(this), 1000);
        }
    };
};

iD.modes.AddArea = {
    title: "+ Area",
    way: function() {
        return iD.Way({
            tags: { building: 'yes', area: 'yes' }
        });
    },
    enter: function() {
        this.map.dblclickEnable(false);

        var surface = this.map.surface,
            teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addarea');

        teaser.append('circle')
            .attr({ 'class': 'handle', r: 3 })
            .style('pointer-events', 'none');

        surface.on('mousemove.addarea', function() {
            teaser.attr('transform', function() {
                var off = d3.mouse(surface.node());
                return 'translate(' + off + ')';
            });
        });

        function addArea() {
            var t = d3.select(d3.event.target),
                node, way = this.way();

            // connect a way to an existing way
            if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                node = t.data()[0];
            } else {
                node = iD.modes._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
            }

            this.map.perform(iD.actions.startWay(way));
            way.nodes.push(node.id);
            this.map.perform(iD.actions.addWayNode(way, node));
            this.map.selectClick(way);
            this.controller.enter(iD.modes.DrawArea(way.id));
        }

        surface.on('click.addarea', addArea.bind(this));

        d3.select(document).on('keydown.addarea', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        window.setTimeout(function() {
            this.map.dblclickEnable(true);
        }.bind(this), 1000);
        this.map.surface.on('click.addarea', null)
            .on('mousemove.addarea', null);
        d3.select(document).on('keydown.addarea', null);
        d3.selectAll('#addarea').remove();
    }
};

iD.modes.DrawArea = function(way_id) {
    return {
        enter: function() {
            this.map.dblclickEnable(false);
            var surface = this.map.surface,

            nextnode = iD.modes._node([NaN, NaN]);
            var nextnode_id = nextnode.id;

            var way = this.map.history.graph().entity(way_id);
            var firstnode_id = _.first(way.nodes);
            way.nodes.push(nextnode_id);
            this.map.perform(iD.actions.addWayNode(way, nextnode));

            surface.on('mousemove.drawarea', function() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var way = this.map.history.graph().entity(way_id);
                var node = iD.Entity(this.map.history.graph().entity(nextnode_id), {
                    lon: ll[0],
                    lat: ll[1]
                });
                this.map.history.replace(iD.actions.addWayNode(way, node));
                var only = iD.Util.trueObj([way.id].concat(_.pluck(way.nodes, 'id')));
                this.map.redraw(only);
            }.bind(this));

            function drawArea() {
                var t = d3.select(d3.event.target);
                d3.event.stopPropagation();
                if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                    if (t.data()[0].id == firstnode_id) {
                        var l = this.map.history.graph().entity(way.nodes.pop());
                        this.map.perform(iD.actions.removeWayNode(way, l));
                        way.nodes.push(way.nodes[0]);
                        this.map.perform(iD.actions.addWayNode(way,
                            this.map.history.graph().entity(way.nodes[0])));
                        // End by clicking on own tail
                        return this.exit();
                    } else {
                        // connect a way to an existing way
                        node = t.data()[0];
                    }
                } else {
                    node = iD.modes._node(this.map.projection.invert(
                        d3.mouse(surface.node())));
                }
                way.nodes.pop();
                way.nodes.push(node.id);
                this.map.perform(iD.actions.addWayNode(way, node));
                way.nodes = way.nodes.slice();
                this.controller.enter(iD.modes.DrawArea(way_id));
            }
            surface.on('click.drawarea', drawArea.bind(this));
        },
        exit: function() {
            this.map.surface.on('mousemove.drawarea', null);
            this.map.surface.on('click.drawarea', null);
            this.map.surface.on('dblclick.drawarea', null);
            d3.select(document).on('.drawarea', null);
            d3.selectAll('#drawarea').remove();
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
