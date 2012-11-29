iD.modes = {};

// Modes are entered by bindings to clicks and keypresses, and exited by the same.
//
// Modes aim to include a bare minimum of 'business logic' - this is separated
// into actions.

iD.modes._node = function(ll) {
    return iD.Node({
        lat: ll[1],
        lon: ll[0],
        tags: {}
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

iD.modes.dist = function(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
};

iD.modes.chooseIndex = function(way, point, map) {
    var dist = iD.modes.dist;
    var projNodes = way.nodes.map(function(n) {
        return map.projection([n.lon, n.lat]);
    });
    for (var i = 0, changes = []; i < projNodes.length - 1; i++) {
        changes[i] =
            (dist(projNodes[i], point) + dist(point, projNodes[i + 1])) /
            dist(projNodes[i], projNodes[i + 1]);
    }
    return _.indexOf(changes, _.min(changes)) + 1;
};

// user has clicked 'add road' or pressed a keybinding, and now has
// a teaser node and needs to click on the map to start a road
iD.modes.AddRoad = {
    title: "+ Road",
    way: function() {
        return iD.Way({ tags: { highway: 'residential', elastic: 'true' } });
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

        // http://bit.ly/SwUwIL
        // http://bit.ly/WxqGng
        function addRoad() {
            var t = d3.select(d3.event.target),
                node,
                direction = 'forward',
                start = true,
                way = this.way();

            // connect a way to an existing way
            if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                // continue an existing way
                var id = t.data()[0].id;
                var parents = this.map.history.graph().parents(id);
                if (parents.length && parents[0].nodes[0] === id) {
                    way = parents[0];
                    direction = 'backward';
                    start = false;
                } else if (parents.length && _.last(parents[0].nodes) === id) {
                    way = parents[0];
                    start = false;
                }
                node = t.data()[0];
            // snap into an existing way
            } else if (t.data() && t.data()[0] && t.data()[0].type === 'way') {
                var index = iD.modes.chooseIndex(t.data()[0], d3.mouse(surface.node()), this.map);
                node = iD.modes._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
                var connectedWay = this.map.history.graph().entity(t.data()[0].id);
                connectedWay.nodes.splice(index, 0, node.id);
                this.map.perform(iD.actions.addWayNode(connectedWay, node));
            } else {
                node = iD.modes._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
            }

            if (start) {
                this.map.perform(iD.actions.startWay(way));
                way.nodes.push(node.id);
                this.map.perform(iD.actions.addWayNode(way, node));
            }
            this.controller.enter(iD.modes.DrawRoad(way.id, direction));
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
iD.modes.DrawRoad = function(way_id, direction) {
    return {
        enter: function() {
            var push = (direction === 'forward') ? 'push' : 'unshift',
                pop = (direction === 'forward') ? 'pop' : 'shift';
            this.map.dblclickEnable(false);
            var surface = this.map.surface,

            nextnode = iD.modes._node([NaN, NaN]);
            var nextnode_id = nextnode.id;

            var way = this.map.history.graph().entity(way_id);
            var firstNode = way.nodes[0];
            var lastNode = _.last(way.nodes);
            way.nodes[push](nextnode_id);
            this.map.perform(iD.actions.addWayNode(way, nextnode));

            surface.on('mousemove.drawroad', function() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var way = this.map.history.graph().entity(way_id);
                var node = iD.Entity(this.map.history.graph().entity(nextnode_id), {
                    lon: ll[0], lat: ll[1]
                });
                this.map.history.replace(iD.actions.addWayNode(way, node));
                var only = iD.Util.trueObj([way.id].concat(_.pluck(way.nodes, 'id')));
                this.map.redraw(only);
            }.bind(this));

            function drawRoad() {
                var t = d3.select(d3.event.target);
                d3.event.stopPropagation();
                if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                    if (t.data()[0].id == firstNode || t.data()[0].id == lastNode) {
                        var l = this.map.history.graph().entity(way.nodes[pop]());
                        this.map.perform(iD.actions.removeWayNode(way, l));
                        // If this is drawing a loop and this is not the drawing
                        // end of the stick, finish the circle
                        if (direction === 'forward' && t.data()[0].id == firstNode) {
                            way.nodes[push](firstNode);
                            this.map.perform(iD.actions.addWayNode(way,
                                this.map.history.graph().entity(firstNode)));
                        } else if (direction === 'backward' && t.data()[0].id == lastNode) {
                            way.nodes[push](lastNode);
                            this.map.perform(iD.actions.addWayNode(way,
                                this.map.history.graph().entity(lastNode)));
                        }
                        delete way.tags.elastic;
                        this.map.perform(iD.actions.changeTags(way, way.tags));
                        // End by clicking on own tail
                        return this.exit();
                    } else {
                        // connect a way to an existing way
                        node = t.data()[0];
                    }
                } else if (t.data() && t.data()[0] && t.data()[0].type === 'way') {
                    var index = iD.modes.chooseIndex(t.data()[0], d3.mouse(surface.node()), this.map);
                    node = iD.modes._node(this.map.projection.invert(
                        d3.mouse(surface.node())));
                    var connectedWay = this.map.history.graph().entity(t.data()[0].id);
                    connectedWay.nodes.splice(1, 0, node.id);
                    this.map.perform(iD.actions.addWayNode(connectedWay, node));
                } else {
                    node = iD.modes._node(this.map.projection.invert(
                        d3.mouse(surface.node())));
                }
                var old = this.map.history.graph().entity(way.nodes[pop]());
                this.map.perform(iD.actions.removeWayNode(way, old));
                way.nodes[push](node.id);
                this.map.perform(iD.actions.addWayNode(way, node));
                way.nodes = way.nodes.slice();
                this.controller.enter(iD.modes.DrawRoad(way_id, direction));
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
            tags: { building: 'yes', area: 'yes', elastic: 'true' }
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
                        delete way.tags.elastic;
                        this.map.perform(iD.actions.changeTags(way, way.tags));
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
                var old = this.map.history.graph().entity(way.nodes.pop());
                this.map.perform(iD.actions.removeWayNode(way, old));
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
