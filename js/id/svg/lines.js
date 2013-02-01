iD.svg.Lines = function(projection) {

    var arrowtext = '►\u3000\u3000',
        alength;

    var highway_stack = {
        motorway: 0,
        motorway_link: 1,
        trunk: 2,
        trunk_link: 3,
        primary: 4,
        primary_link: 5,
        secondary: 6,
        tertiary: 7,
        unclassified: 8,
        residential: 9,
        service: 10,
        footway: 11
    };

    function waystack(a, b) {
        if (!a || !b || !a.tags || !b.tags) return 0;
        if (a.tags.layer !== undefined && b.tags.layer !== undefined) {
            return a.tags.layer - b.tags.layer;
        }
        if (a.tags.bridge) return 1;
        if (b.tags.bridge) return -1;
        var as = 0, bs = 0;
        if (a.tags.highway && b.tags.highway) {
            as -= highway_stack[a.tags.highway];
            bs -= highway_stack[b.tags.highway];
        }
        return as - bs;
    }

    return function drawLines(surface, graph, entities, filter) {
        function drawPaths(group, lines, filter, classes, lineString) {
            var paths = group.selectAll('path.line')
                .filter(filter)
                .data(lines, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', classes);

            paths
                .order()
                .attr('d', lineString)
                .call(iD.svg.TagClasses())
                .call(iD.svg.MemberClasses(graph));

            paths.exit()
                .remove();

            return paths;
        }

        if (!alength) {
            var arrow = surface.append('text').text(arrowtext);
            alength = arrow.node().getComputedTextLength();
            arrow.remove();
        }

        var lines = [],
            lineStrings = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) === 'line') {
                lines.push(entity);
            }
        }

        lines.sort(waystack);

        var lineString = iD.svg.LineString(projection, graph);

        var shadow = surface.select('.layer-shadow'),
            casing = surface.select('.layer-casing'),
            stroke = surface.select('.layer-stroke'),
            defs   = surface.select('defs'),
            text   = surface.select('.layer-text'),
            shadows = drawPaths(shadow, lines, filter, 'way line shadow', lineString),
            casings = drawPaths(casing, lines, filter, 'way line casing', lineString),
            strokes = drawPaths(stroke, lines, filter, 'way line stroke', lineString);

        // Determine the lengths of oneway paths
        var lengths = {},
            oneways = strokes.filter(function (d) { return d.isOneWay(); }).each(function(d) {
                lengths[d.id] = Math.floor(this.getTotalLength() / alength);
            }).data();

        var uses = defs.selectAll('path')
            .filter(filter)
            .data(oneways, iD.Entity.key);

        uses.enter()
            .append('path');

        uses
            .attr('id', function(d) { return 'shadow-' + d.id; })
            .attr('d', lineString);

        uses.exit()
            .remove();

        var labels = text.selectAll('text')
            .filter(filter)
            .data(oneways, iD.Entity.key);

        var tp = labels.enter()
            .append('text')
                .attr({ 'class': 'oneway', dy: 4 })
            .append('textPath')
                .attr('class', 'textpath');

        labels.exit().remove();

        text.selectAll('.textpath')
            .filter(filter)
            .attr('xlink:href', function(d, i) { return '#shadow-' + d.id; })
            .text(function(d) {
                // adding longer text than necessary, since overflow is hidden
                return (new Array(Math.floor(lengths[d.id] * 1.1))).join(arrowtext);
            });
    };
};
