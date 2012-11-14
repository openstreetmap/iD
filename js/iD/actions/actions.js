iD.actions = {};

// Actions are like 'modes' for the editor. They are entered by bindings to
// clicks and keypresses, and exited by the same.
//
// Actions aim to include a bare minimum of 'business logic' - this is separated
// into operations.

iD.actions._node = function(ll) {
    return iD.Entity({
        type: 'node',
        lat: ll[1],
        lon: ll[0],
        id: iD.Util.id('node'),
        tags: {}
    });
};

iD.actions.AddPlace = {
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#place').classed('active', true);

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
            var n = iD.actions._node(ll);
            n._poi = true;
            this.map.operate(iD.operations.addNode(n));
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
        d3.selectAll('button#place').classed('active', false);
    }
};

iD.actions.AddRoad = {
    way: function(ll) {
        return iD.Entity({
            type: 'way',
            nodes: [],
            tags: {
                highway: 'residential'
            },
            modified: true,
            id: iD.Util.id('way')
        });
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#road').classed('active', true);

        var surface = this.map.surface;
        this.map.handleDrag(false);
        var teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addroad');

        teaser.append('circle')
            .attr('class', 'handle')
            .style('pointer-events', 'none')
            .attr('r', 3);

        surface.on('mousemove.addroad', function() {
            teaser.attr('transform', function() {
                var off = d3.mouse(surface.node());
                return 'translate(' + off + ')';
            });
        });

        surface.on('click.addroad', function() {
            var t = d3.select(d3.event.target);
            var node;
            var way = this.way();

            // connect a way to an existing way
            if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                node = t.data()[0];
            } else {
                node = iD.actions._node(this.map.projection.invert(
                    d3.mouse(surface.node())));
            }

            way.nodes.push(node.id);
            this.map.operate(iD.operations.changeWayNodes(way, node));
            this.map.selectClick(way);
            this.controller.go(iD.actions.DrawRoad(way));
        }.bind(this));

        d3.select(document).on('keydown.addroad', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.surface.on('click.addroad', null);
        this.map.surface.on('mousemove.addroad', null);
        this.map.handleDrag(true);
        d3.select(document).on('keydown.addroad', null);
        d3.selectAll('#addroad').remove();
        d3.selectAll('button#road').classed('active', false);
    }
};

iD.actions.DrawRoad = function(way) {
    return {
        enter: function() {
            var surface = this.map.surface;
            var lastNode = this.map.history.graph().entity(way.nodes[way.nodes.length - 1]);
            this.nextnode = iD.actions._node([lastNode.lon, lastNode.lat]);
            way.nodes.push(this.nextnode.id);
            this.map.operate(iD.operations.changeWayNodes(way, this.nextnode));

            surface.on('mousemove.drawroad', function() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                this.map.history.replace(iD.operations.move(this.nextnode, ll));
                this.map.update();
            }.bind(this));

            surface.on('click.drawroad', function() {
                if (this._doubleTime) {
                    window.clearTimeout(this._doubleTime);
                    this._doubleTime = null;
                } else {
                    // forgive me
                    var that = this;
                    this._doubleTime = window.setTimeout(function(e) {
                        return function() {
                            d3.event = e;
                            var t = d3.select(d3.event.target);
                            d3.event.stopPropagation();
                            // connect a way to an existing way
                            if (t.data() && t.data()[0] && t.data()[0].type === 'node') {
                                node = t.data()[0];
                            } else {
                                node = iD.actions._node(that.map.projection.invert(
                                    d3.mouse(surface.node())));
                            }
                            way.nodes.pop();
                            way.nodes.push(node.id);
                            that.map.operate(iD.operations.changeWayNodes(way, node));
                            way.nodes = way.nodes.slice();
                            that.controller.go(iD.actions.DrawRoad(way));
                        };
                    }(_.clone(d3.event)), 150);
                }
            }.bind(this));

            surface.on('dblclick.drawroad', function() {
                d3.event.stopPropagation();
                this.exit();
            }.bind(this));
        },
        exit: function() {
            this.map.surface.on('mousemove.drawroad', null);
            this.map.surface.on('click.drawroad', null);
            this.map.surface.on('dblclick.drawroad', null);
            d3.select(document).on('.drawroad', null);
            d3.selectAll('#drawroad').remove();
        }
    };
};

iD.actions.AddArea = {
    way: function(ll) {
        return iD.Entity({
            type: 'way',
            nodes: [],
            tags: {
                building: 'yes'
            },
            modified: true,
            id: iD.Util.id('way')
        });
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#area').classed('active', true);

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
            var node = iD.actions._node(ll);
            way.nodes.push(node.id);

            this.map.operate(iD.operations.changeWayNodes(way, node));
            this.map.selectClick(way);
            this.controller.go(iD.actions.DrawArea(way));
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
        d3.selectAll('button#area').classed('active', false);
    }
};

iD.actions.DrawArea = function(way) {
    return {
        enter: function() {
            var surface = this.map.surface;

            var lastNode = this.map.history.graph().entity(way.nodes[way.nodes.length - 1]);
            var firstNode = this.map.history.graph().entity(way.nodes[0]);

            this.nextnode = iD.actions._node([lastNode.lon, lastNode.lat]);

            way.nodes.push(this.nextnode.id);
            way.nodes.push(firstNode.id);
            this.map.operate(iD.operations.changeWayNodes(way, this.nextnode));
            this.map.operate(iD.operations.changeWayNodes(way, firstNode));

            surface.on('mousemove.drawarea', function() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                this.map.history.replace(iD.operations.move(this.nextnode, ll));
                this.map.update();
            }.bind(this));

            surface.on('click.drawarea', function() {
                d3.event.stopPropagation();
                way.nodes.pop();
                way.nodes.pop();
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var node = iD.actions._node(ll);
                way.nodes.push(node.id);
                this.map.operate(iD.operations.changeWayNodes(way, node));
                this.controller.go(iD.actions.DrawRoad(way));
            }.bind(this));

            surface.on('dblclick.drawarea', function() {
                d3.event.stopPropagation();
                var a = this.map.history.graph().entity(way.nodes.pop());
                var b = this.map.history.graph().entity(way.nodes.pop());
                this.map.operate(iD.operations.changeWayNodes(way, a));
                this.map.operate(iD.operations.remove(a));
                this.map.operate(iD.operations.remove(b));
                way.nodes.push(way.nodes[0]);
                var closeNode = this.map.history.graph().entity(way.nodes[0]);
                this.map.operate(iD.operations.changeWayNodes(way, closeNode));
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

iD.actions.Move = {
    enter: function() {
        d3.selectAll('button').classed('active', false);
    },
    exit: function() { }
};
