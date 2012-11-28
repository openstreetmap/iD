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
        var surface = this.map.surface;
        var teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addplace');

        teaser.append('circle')
            .attr('class', 'handle')
            .attr('r', 3);

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
        this.map.surface.on('mousemove.addplace', null);
        this.map.surface.on('click.addplace', null);
        d3.select(document).on('keydown.addplace', null);
        d3.selectAll('#addplace').remove();
    }
};

iD.modes.AddRoad = {
    title: "+ Road",
    way: function() {
        return iD.Way({tags: {highway: 'residential'}});
    },
    enter: function() {
        var surface = this.map.surface;
        var teaser = surface.selectAll('g#temp-g')
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

        surface.on('click.addroad', function() {
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
        }.bind(this));

        d3.select(document).on('keydown.addroad', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.surface.on('click.addroad', null);
        this.map.surface.on('mousemove.addroad', null);
        d3.select(document).on('keydown.addroad', null);
        d3.selectAll('#addroad').remove();
    }
};

iD.modes.DrawRoad = function(way_id) {
    return {
        enter: function() {
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

            surface.on('click.drawroad', function() {
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
            }.bind(this));
        },
        exit: function() {
            this.map.surface.on('mousemove.drawroad', null);
            this.map.surface.on('click.drawroad', null);
            d3.select(document).on('.drawroad', null);
            d3.selectAll('#drawroad').remove();
        }
    };
};

iD.modes.AddArea = {
    title: "+ Area",
    way: function() {
        return iD.Way({tags: {building: 'yes'}});
    },
    enter: function() {
        var surface = this.map.surface;
        var teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addroad');

        teaser.append('circle')
            .attr('class', 'handle')
            .attr('r', 3);

        surface.on('mousemove.addroad', function() {
            teaser.attr('transform', function() {
                var off = d3.mouse(surface.node());
                return 'translate(' + off + ')';
            });
        });

        surface.on('click.addroad', function() {
            var ll = this.map.projection.invert(
                d3.mouse(surface.node()));

            var way = this.way();
            var node = iD.modes._node(ll);
            way.nodes.push(node.id);

            this.map.perform(iD.actions.changeWayNodes(way, node));
            this.map.selectClick(way);
            this.controller.enter(iD.modes.DrawArea(way));
        }.bind(this));

        d3.select(document).on('keydown.addroad', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.surface.on('click.addarea', null);
        this.map.surface.on('mousemove.addarea', null);
        d3.select(document).on('keydown.addarea', null);
        d3.selectAll('#addroad').remove();
    }
};

iD.modes.DrawArea = function(way) {
    return {
        enter: function() {
            var surface = this.map.surface;

            var lastNode = this.map.history.graph().entity(way.nodes[way.nodes.length - 1]);
            var firstNode = this.map.history.graph().entity(way.nodes[0]);

            this.nextnode = iD.modes._node([lastNode.lon, lastNode.lat]);

            way.nodes.push(this.nextnode.id);
            way.nodes.push(firstNode.id);
            this.map.perform(iD.actions.changeWayNodes(way, this.nextnode));
            this.map.perform(iD.actions.changeWayNodes(way, firstNode));

            surface.on('mousemove.drawarea', function() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                this.map.history.replace(iD.actions.move(this.nextnode, ll));
                this.map.update();
            }.bind(this));

            surface.on('click.drawarea', function() {
                d3.event.stopPropagation();
                way.nodes.pop();
                way.nodes.pop();
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var node = iD.modes._node(ll);
                way.nodes.push(node.id);
                this.map.perform(iD.actions.changeWayNodes(way, node));
                this.controller.enter(iD.modes.DrawRoad(way));
            }.bind(this));

            surface.on('dblclick.drawarea', function() {
                d3.event.stopPropagation();
                var a = this.map.history.graph().entity(way.nodes.pop());
                var b = this.map.history.graph().entity(way.nodes.pop());
                this.map.perform(iD.actions.changeWayNodes(way, a));
                this.map.perform(iD.actions.remove(a));
                this.map.perform(iD.actions.remove(b));
                way.nodes.push(way.nodes[0]);
                var closeNode = this.map.history.graph().entity(way.nodes[0]);
                this.map.perform(iD.actions.changeWayNodes(way, closeNode));
                this.exit();
            }.bind(this));
        },
        exit: function() {
            this.map.surface.on('mousemove.drawarea', null);
            this.map.surface.on('click.drawarea', null);
            this.map.surface.on('dblclick.drawarea', null);
            d3.select(document).on('.drawarea', null);
            d3.selectAll('#drawarea').remove();
        }
    };
};

iD.modes.Move = {
    enter: function() { },
    exit: function() { }
};
