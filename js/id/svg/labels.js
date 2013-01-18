iD.svg.Labels = function() {

    var pointOffsets = [
        [25, 3, 'start'], // right
        [-15, 3, 'end'], // left
    ];

    var height = 12,
        width = 6;

    function drawTextPaths(group, labels, filter, classes, t) {

        var reverse = t('reverse');

        var texts = group.selectAll('text.textpath-label')
            .data(labels);

        var tp = texts.enter()
            .append('text')
            .attr({ 'class': classes})
            .append('textPath')
            .attr({
                'class': 'textpath',
                'startOffset': '50%'
            });

        var tps = group.selectAll('.textpath-label .textpath')
            .data(labels)
            .attr({
                'xlink:href': function(d, i) { return '#casing-' + d.id},
                'glyph-orientation-vertical': function(d, i) {return reverse(d, i) ? 180 : 0}, 
                'glyph-orientation-horizontal': function(d, i) {return reverse(d, i) ? 180 : 0},
                'dominant-baseline': 'central'
            })
            .text(function(d, i) {
                return reverse(d, i) ? d.tags.name.split('').reverse().join('') : d.tags.name;
            });

        texts.exit().remove();

    }

    function drawTexts(group, labels, filter, classes, position) {
        var texts = group.selectAll('text.text-label')
            .filter(filter)
            .data(labels);

        texts.enter()
            .append('text')
            .attr('class', classes);

        texts.attr('x', position('x'))
            .attr('y', position('y'))
            .attr('transform', position('transform'))
            .style('text-anchor', position('textAnchor'))
            .text(function(d) { return d.tags.name });

        texts.exit().remove();
        return texts;
    }

    function getPathTransform(projection) {
        var nodeCache = {};
        return function pathTransform(entity) {
            var length = 0,
                w = entity.tags.name.length * width;

            var nodes = nodeCache[entity.id];
            if (typeof nodes  === 'undefined') {
                nodes = nodeCache[entity.id] = _.pluck(entity.nodes, 'loc')
                    .map(iD.svg.RoundProjection(projection));
            }

            function segmentLength(i) {
                var dx = nodes[i][0] - nodes[i + 1][0];
                var dy = nodes[i][1] - nodes[i + 1][1];
                return Math.sqrt(dx * dx + dy * dy);
            }

            for (var i = 0; i < nodes.length - 1; i++) {
                length += segmentLength(i);
            }

            if (length < w + 20) return null;

            var ends = (length - w) / 2,
                sofar = 0,
                start, end,
                n1, n2;

            for (var i = 0; i < nodes.length - 1; i++) {
                var current = segmentLength(i);
                if (!start && sofar + current > ends) {
                    var portion = (ends - sofar) / current;
                    start = [
                        nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                        nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                    ];
                    n1 = nodes[i + 1];
                }
                if (!end && sofar + current > length - ends) {
                    var portion = (length - ends - sofar) / current;
                    end = [
                        nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                        nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                    ];
                    n2 = nodes[i];
                }
                sofar += current;
            }

            var angle = Math.atan2(n1[1] - start[1], n1[0] - start[0]);
            var reverse = !(start[0] < end[0] && angle < Math.PI/2 && angle > - Math.PI/2);

            return {
                length: length,
                width: Math.abs(start[0] - end[0]),
                height: Math.abs(start[1] - end[1]),
                start: start,
                end: end,
                reverse: reverse
            };
        }
    }


    return function drawLabels(surface, graph, entities, filter, projection) {

        var project = iD.svg.RoundProjection(projection);
        var rtree = new RTree();

        function addPoint(d, i) {
            var bbox = this.getBBox();
            var coords = project(d.loc);
            var tree = new RTree.Rectangle(coords[0], coords[1], bbox.width, bbox.height);
            rtree.insert(tree, d.id);
        }

        //d3.selectAll('.node.point').each(addPoint);

        var points = [],
            roads = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'line' && entity.tags.highway && entity.tags.name) {
                roads.push(entity);
            } else if (entity.geometry() === 'point' && entity.tags.name) {
                points.push(entity);
            }
        }

        var entities = roads.concat(points);
        var rect;
        var pathTransform = getPathTransform(projection);
        var textlabels = [],
            pathlabels = [],
            textpositions = [],
            pathpositions = [];

        function nocollisions(rect) {
            var v = rtree.search(rect, true).length === 0;
            if (v) rtree.insert(rect);
            return v;
        }

        for (var i = 0; i < entities.length; i ++) {
            var p = {},
                entity = entities[i],
                w = width * entity.tags.name.length,
                h = 20;

            if (entity.type === 'node') {
                var coord = project(entity.loc),
                    offset = pointOffsets[0];
                p.x = coord[0] + offset[0];
                p.y = coord[1] + offset[1];
                p.textAnchor = offset[2];
                rect = new RTree.Rectangle(p.x, p.y, width * entity.tags.name.length, 20);
                if (nocollisions(rect)) {
                    textpositions.push(p);
                    textlabels.push(entity);
                }

            } else if (entity.type === 'way' && entity.geometry() === 'line') {
                p = pathTransform(entity);
                if (!p) continue;
                rect = new RTree.Rectangle(Math.min(p.start[0], p.end[0]) - 5, Math.min(p.start[1], p.end[1]) - 5, p.width + 10, p.height + 10);
                if (nocollisions(rect)) {
                    pathpositions.push(p);
                    pathlabels.push(entity);
                }
            }

        }


        function textposition(attr) {
            return function(d, i) { return textpositions[i][attr] };
        }
        function pathposition(attr) {
            return function(d, i) { return pathpositions[i][attr] };
        }

        var label = surface.select('.layer-label'),
            texts = drawTexts(label, textlabels, filter, 'text-label', textposition),
            textPaths = drawTextPaths(label, pathlabels, filter, 'textpath-label', pathposition);
    };

};
