iD.ui.Scale = function(context) {
    var projection = context.projection,
        imperial = (iD.detect().locale.toLowerCase() === 'en-us'),
        maxLength = 180,
        tickHeight = 8;

    function scaleDefs(loc1, loc2) {
        var lat = (loc2[1] + loc1[1]) / 2,
            conversion = (imperial ? 3.28084 : 1),
            dist = iD.geo.lonToMeters(loc2[0] - loc1[0], lat) * conversion,
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

        dLon = iD.geo.metersToLon(scale.dist / conversion, lat);
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
            .attr('transform', 'translate(10,11)');

        g.append('path').attr('id', 'scalepath');
        g.append('text').attr('id', 'scaletext');

        update(selection);

        context.map().on('move.scale', function() {
            update(selection);
        });
    };
};
