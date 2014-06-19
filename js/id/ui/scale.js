iD.ui.Scale = function(context) {
    var projection = context.projection,
        tickHeight = 8;

    // http://stackoverflow.com/a/27943/7620
    // Haversine distance formula
    function distance(loc1, loc2) {
        var R = 6371009;  // Mean radius of the earth in m
        var dLat = (loc2[1] - loc1[1]) * (Math.PI / 180);
        var dLon = (loc2[0] - loc1[0]) * (Math.PI / 180);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(loc1[1] * (Math.PI / 180)) *
            Math.cos(loc2[1] * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;  // Distance in m
        return d;
    };

    function update(selection) {
        var x = 180,
            dims = context.map().dimensions(),
            loc1 = projection.invert([0, dims[1]]),
            loc2 = projection.invert([x, dims[1]]),
            dist = distance(loc1, loc2);

        selection.select('#scalepath')
            .attr('d', 'M0.5,0.5v'+ tickHeight +'h' + x + 'v-' + tickHeight);

        selection.select('#scaletext')
            .attr('x', x + 5)
            .attr('y', tickHeight)
            .text(String(Math.floor(dist)) + ' m');
    };

    return function(selection) {
        var g = selection.append('svg')
            .attr('id', 'scale')
            .append('g')
            .attr('transform', 'translate(10,' + tickHeight + ')');

        g.append('path').attr('id', 'scalepath');
        g.append('text').attr('id', 'scaletext');

        update(selection);

        context.map().on('move.scale', function() {
            update(selection);
        });
    };
};
