iD.actions = {};

iD.actions.AddPlace = {
    bind: function(controller, map) {
        this.controller = controller;
        this.map = map;
        d3.selectAll('button#place').on('click', function() {
            iD.actions.AddPlace.enter();
        });
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#place').classed('active', true);

        var surface = this.map.surface;
        var teaser = surface.selectAll('g#temp-g')
            .append('g').attr('id', 'teaser-g');

        teaser.append('circle')
            .attr('class', 'teaser-point')
            .attr('r', 10);

        surface.on('mousemove.shift', function() {
            teaser.attr('transform', function() {
                var off = d3.mouse(surface.node());
                return 'translate(' + off + ')';
            });
        });

        surface.on('click', function() {
            var off = d3.mouse(surface.node());
            this.exit();
        }.bind(this));

        // Bind clicks to the map to 'add a place' and
        // add little floaty place
    },
    exit: function() {
        this.map.surface.on('mousemove.shift', null);
        d3.selectAll('#teaser-g').remove();
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

        // Bind clicks to the map to 'add a road' and
        // add little floaty point
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

        // Bind clicks to the map to 'add an area' and
        // add little floaty point
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

    // Pressing 'escape' should exit any action.
    d3.select(document).on('keydown', function() {
        if (d3.event.keyCode === 27) {
            controller.go(iD.actions.Move);
        }
    });

    return controller;
};
