iD.svg.Labels = function() {

    function drawTexts(group, labels, filter, classes, position) {
        var texts = group.selectAll('text')
            .filter(filter)
            .data(labels);

        texts.enter()
            .append('text')
            .attr('class', classes);

        texts.attr('x', position('x'))
            .attr('y', position('y'))
            .attr('transform', position('transform'))
            .text(function(d) { return d.tags.name });

        texts.exit().remove();
        return texts;
    }

    return function drawLabels(surface, graph, entities, filter, projection) {

        var points = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'point' && entity.tags.name) {
                points.push(entity);
            }
        }

        var labels = points;
        var positions = [];

        var project = iD.svg.RoundProjection(projection);

        for (var i = 0; i < labels.length; i ++) {
            positions[i] = {};
            var l = labels[i];
            if (l.type === 'node') {
                var coord = project(l.loc);
                positions[i].x = coord[0];
                positions[i].y = coord[1];
            }
        }

        function position(attr) {
            return function(d, i) { return positions[i][attr] };
        }

        var label = surface.select('.layer-label'),
            texts = drawTexts(label, labels, filter, 'todo', position);


    };

};
