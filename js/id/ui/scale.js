iD.ui.Scale = function(context) {
    var projection = context.projection,
        imperial = (iD.detect().locale === 'en-us'),
        maxLength = 180,
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
    }

    function scaleDefs(loc1, loc2) {
        var lat = (loc2[1] + loc1[1]) / 2,
            conversion = (imperial ? 3.28084 : 1),
            dist = distance(loc1, loc2) * conversion,
            scale = { dist: 0, px: 0, text: '' },
            buckets, i, val, dLon;

        if (imperial) {
            buckets = [5280000, 528000, 52800, 5280, 500, 50, 5, 1];
        } else {
            buckets = [5000000, 500000, 50000, 5000, 500, 50, 5, 1];
        }

        // determine a user-friendly endpoint for the scale
        for (i = 0; i < buckets.length; i++) {
            val = buckets[i];
            if (dist >= val) {
                scale.dist = Math.floor(dist / val) * val;
                break;
            }
        }

        dLon = scale.dist / (111132.954 * conversion) / Math.abs(Math.cos( lat * (Math.PI / 180)));
        scale.px = Math.round(projection([loc1[0] + dLon, loc1[1]])[0]);

        if (imperial) {
            if (scale.dist >= 5280) {
                scale.dist /= 5280;
                scale.text = String(scale.dist) + ' mi';
            } else {
                scale.text = String(scale.dist) + ' ft';
            }
        } else {
            if (scale.dist >= 1000) {
                scale.dist /= 1000;
                scale.text = String(scale.dist) + ' km';
            } else {
                scale.text = String(scale.dist) + ' m';
            }
        }

        return scale;
    }

    function update(selection) {
        // choose loc1, loc2 along bottom of viewport (near where the scale will be drawn)
        var dims = context.map().dimensions(),
            loc1 = projection.invert([0, dims[1]]),
            loc2 = projection.invert([maxLength, dims[1]]),
            scale = scaleDefs(loc1, loc2);

        selection.select('#scalepath')
            .attr('d', 'M0.5,0.5v' + tickHeight + 'h' + scale.px + 'v-' + tickHeight);

        selection.select('#scaletext')
            .attr('x', scale.px + 8)
            .attr('y', tickHeight)
            .text(scale.text);
    }

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
