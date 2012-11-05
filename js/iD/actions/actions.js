iD.actions = {};

iD.actions.AddPlace = {
    bind: function(controller, map) {
        this.controller = controller;
        this.map = map;
        d3.selectAll('button#place').on('click', function() {
            iD.actions.AddPlace.enter();
        });
    },
    node: function(ll) {
        return {
            type: 'node',
            lat: ll[1],
            lon: ll[0],
            id: iD.Util.id(),
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
    bind: function(controller, map) {
        this.controller = controller;
        this.map = map;
        d3.selectAll('button#road').on('click', function() {
            iD.actions.AddRoad.enter();
        });
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#road').classed('active', true);
    },
    exit: function() {
        d3.selectAll('button#road').classed('active', false);
    }
};

iD.actions.AddArea = {
    bind: function(controller, map) {
        this.controller = controller;
        this.map = map;
        d3.selectAll('button#area').on('click', function() {
            iD.actions.AddArea.enter();
        });
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#area').classed('active', true);
    },
    exit: function() {
        d3.selectAll('button#area').classed('active', false);
    }
};

iD.actions.Move = {
    bind: function(controller, map) {
        this.controller = controller;
        this.map = map;
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
    },
    exit: function() { }
};

iD.controller = function(map) {
    var controller = { action: null };

    for (var a in iD.actions) iD.actions[a].bind(controller, map);

    controller.go = function(x) {
        if (controller.action) {
            controller.action.exit();
        }
        x.enter();
        controller.action = x;
    };

    controller.go(iD.actions.Move);

    return controller;
};
