iD.actions = {};

iD.actions.AddPlace = {
    bind: function() {
        d3.selectAll('button#place').on('click', function() {
            iD.actions.AddPlace.enter();
        });
    },
    enter: function() {
        d3.selectAll('button').classed('active', false);
        d3.selectAll('button#place').classed('active', true);

        // Bind clicks to the map to 'add a place' and
        // add little floaty place
    },
    exit: function() {
        d3.selectAll('button#place').classed('active', false);
    }
};

iD.actions.AddRoad = {
    bind: function() {
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
    bind: function() {
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
