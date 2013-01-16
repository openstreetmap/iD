iD.svg.Lines = function() {

    var arrowtext = '►\u3000\u3000',
        alength;

    function drawPaths(group, lines, filter, classes, lineString) {
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

    return function(surface, graph, entities, filter, projection) {

        if (!alength) {
            var arrow = surface.append('text').text(arrowtext);
            alength = arrow.node().getComputedTextLength();
            arrow.remove();
        }

        var lines = [],
            lineStrings = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'line') {
                lines.push(entity);
            }
        }

        function lineString(entity) {
            if (lineStrings[entity.id] !== undefined) {
                return lineStrings[entity.id];
            }
            var nodes = _.pluck(entity.nodes, 'loc');
            if (nodes.length === 0) return (lineStrings[entity.id] = '');
            else return (lineStrings[entity.id] =
                'M' + nodes.map(iD.svg.RoundProjection(projection)).join('L'));
        }

        var casing = surface.select('.layer-casing'),
            stroke = surface.select('.layer-stroke'),
            defs   = surface.select('defs'),
            text   = surface.select('.layer-text'),
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
