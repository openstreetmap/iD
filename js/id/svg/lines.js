iD.svg.Lines = function() {
    return function(surface, graph, entities, filter, projection) {
        var arrow = surface.append('text').text('►----'),
            alength = arrow.node().getComputedTextLength();

        arrow.remove();

        var lines = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'line') {
                lines.push(entity);
            }
        }

        var lineStrings = {};

        function lineString(entity) {
            return lineStrings[entity.id] || (lineStrings[entity.id] =
                'M' + _.pluck(entity.nodes, 'loc').map(iD.svg.RoundProjection(projection)).join('L'));
        }

        function drawPaths(group, lines, filter, classes) {
            var paths = group.selectAll('path')
                .filter(filter)
                .data(lines, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', classes);

            paths
                .order()
                .attr('d', lineString)
                .call(iD.svg.TagClasses());

            paths.exit()
                .remove();

            return paths;
        }

        var casing = surface.select('.layer-casing'),
            stroke = surface.select('.layer-stroke'),
            defs   = surface.select('defs'),
            text   = surface.select('.layer-text'),
            casings = drawPaths(casing, lines, filter, 'way line casing'),
            strokes = drawPaths(stroke, lines, filter, 'way line stroke');

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
                return (new Array(Math.floor(lengths[d.id]))).join('►----');
            });
    }
};
