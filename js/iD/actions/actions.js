iD.actions = {};

iD.actions.AddPlace = {
    node: function(ll) {
        return {
            type: 'node',
            lat: ll[1],
            lon: ll[0],
            id: iD.Util.id('node'),
            tags: {}
        };
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#place').classed('active', true);

        var surface = this.map.surface;
        var teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addplace');

        teaser.append('circle')
            .attr('class', 'teaser-point')
            .attr('r', 10);

        surface.on('mousemove.addplace', function() {
            teaser.attr('transform', function() {
                var off = d3.mouse(surface.node());
                return 'translate(' + off + ')';
            });
        });

        surface.on('click.addplace', function() {
            var ll = this.map.projection.invert(
                d3.mouse(surface.node()));
            iD.operations.addNode(this.map, this.node(ll));
            this.exit();
        }.bind(this));

        d3.select(document).on('keydown.addplace', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.surface.on('.addplace', null);
        d3.select(document).on('.addplace', null);
        d3.selectAll('#addplace').remove();
        d3.selectAll('button#place').classed('active', false);
    }
};

iD.actions.AddRoad = {
    node: function(ll) {
        return {
            type: 'node',
            lat: ll[1],
            lon: ll[0],
            id: iD.Util.id('node'),
            modified: true,
            tags: {}
        };
    },
    way: function(ll) {
        return {
            type: 'way',
            nodes: [],
            tags: {
                highway: 'residential'
            },
            modified: true,
            id: iD.Util.id('way')
        };
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#road').classed('active', true);

        var surface = this.map.surface;
        var teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'addroad');

        teaser.append('circle')
            .attr('class', 'teaser-point')
            .attr('r', 10);

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
            var node = this.node(ll);
            way.nodes.push(node.id);
            iD.operations.changeWayNodes(this.map, way, node);
            this.controller.go(iD.actions.DrawRoad(way));
            this.exit();
        }.bind(this));

        d3.select(document).on('keydown.addplace', function() {
            if (d3.event.keyCode === 27) this.exit();
        }.bind(this));
    },
    exit: function() {
        this.map.surface.on('.addroad', null);
        d3.select(document).on('.addroad', null);
        d3.selectAll('#addroad').remove();
        d3.selectAll('button#road').classed('active', false);
    }
};

iD.actions.DrawRoad = function(way) {
    return {
        node: function(ll) {
            return {
                type: 'node',
                lat: ll[1],
                lon: ll[0],
                id: iD.Util.id('node'),
                modified: true,
                tags: {}
            };
        },
        enter: function() {
            var surface = this.map.surface;

            this.falsenode = this.node([0, 0]);

            iD.operations.addTemporary(this.map, this.falsenode);
            // way.nodes = way.nodes.slice();
            way.nodes.push(this.falsenode.id);

            surface.on('mousemove.drawroad', function() {
                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                this.falsenode.lon = ll[0];
                this.falsenode.lat = ll[1];
                this.map.update();
            }.bind(this));

            surface.on('click.drawroad', function() {
                d3.event.stopPropagation();

                way.nodes.pop();

                var ll = this.map.projection.invert(d3.mouse(surface.node()));
                var node = this.node(ll);

                way.nodes.push(node.id);

                iD.operations.changeWayNodes(this.map, way, node);

                way.nodes = way.nodes.slice();
                way.nodes.push(this.falsenode.id);
            }.bind(this));

            surface.on('dblclick.drawroad', function() {
                d3.event.stopPropagation();
                this.exit();
            }.bind(this));
        },
        exit: function() {
            iD.operations.addTemporary(this.map, this.falsenode);
            this.map.surface.on('.drawroad', null);
            d3.select(document).on('.drawroad', null);
            d3.selectAll('#drawroad').remove();
        }
    };
};

iD.actions.AddArea = {
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#area').classed('active', true);
    },
    exit: function() {
        d3.selectAll('button#area').classed('active', false);
    }
};

iD.actions.Move = {
    enter: function() {
        d3.selectAll('button').classed('active', false);
    },
    exit: function() { }
};


iD.controller = function(map) {
    var controller = { action: null };

    controller.go = function(x) {
        x.controller = controller;
        x.map = map;
        if (controller.action) {
            controller.action.exit();
        }
        x.enter();
        controller.action = x;
    };

    controller.go(iD.actions.Move);

    return controller;
};
