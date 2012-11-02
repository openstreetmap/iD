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
    },
    exit: function() {
        d3.selectAll('button#area').classed('active', false);
    }
};
