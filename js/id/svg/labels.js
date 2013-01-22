iD.svg.Labels = function(projection) {

    var pointOffsets = [
        [25, 3, 'start'], // right
        [-15, 3, 'end'], // left
    ];

    var height = 12,
        width = 6;

    function drawLineLabels(group, labels, filter, classes, position) {

        var reverse = position('reverse');

        var texts = group.selectAll('text.' + classes)
            .filter(filter)
            .data(labels, iD.Entity.key);

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

    function drawPointLabels(group, labels, filter, classes, position) {
        var texts = group.selectAll('text.' + classes)
            .filter(filter)
            .data(labels, iD.Entity.key);

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


    return function drawLabels(surface, graph, entities, filter) {

        var rtree = new RTree();

        var points = [],
            roads = [],
            buildings = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'line' && entity.tags.highway && entity.tags.name) {
                roads.push(entity);
            } else if (entity.geometry() === 'point' && entity.tags.name) {
                points.push(entity);
            } else if (entity.geometry() === 'area' && entity.tags.building && entity.tags.name) {
                buildings.push(entity);
            }
        }

        var entities = roads.concat(buildings).concat(points);
        var pathTransform = getPathTransform(projection);

        var positions = {
            point: [],
            line: [],
            area: []
        };

        var labelled = {
            point: [],
            line: [],
            area: []
        };


        for (var i = 0; i < entities.length; i ++) {
            var entity = entities[i],
                p;
            if (entity.geometry() === 'point') {
                p = getPointLabel(entity);
            } else if (entity.geometry() === 'line') {
                p = getLineLabel(entity);
            } else if (entity.geometry() === 'area') {
                p = getAreaLabel(entity);
            }
            if (p) {
                positions[entity.geometry()].push(p);
                labelled[entity.geometry()].push(entity);
            }
        }

        function getPointLabel(entity) {
            var coord = projection(entity.loc),
                offset = pointOffsets[0],
                p = {},
                w = width * entity.tags.name.length;
            p.x = coord[0] + offset[0];
            p.y = coord[1] + offset[1];
            p.textAnchor = offset[2];
            var rect = new RTree.Rectangle(p.x, p.y, w, 20);
            if (tryInsert(rect)) return p;
        }

        function getLineLabel(entity) {
            var p = pathTransform(entity);
            if (!p) return;
            var rect = new RTree.Rectangle(Math.min(p.start[0], p.end[0]) - 5, Math.min(p.start[1], p.end[1]) - 5, p.width + 10, p.height + 10);
            if (tryInsert(rect)) return p;
        }

        function getAreaLabel(entity) {
            var nodes = _.pluck(entity.nodes, 'loc')
                .map(iD.svg.RoundProjection(projection)),
                centroid = iD.util.geo.polygonCentroid(nodes),
                extent = entity.extent(graph),
                entitywidth = projection(extent[1])[0] - projection(extent[0])[0],
                w = width * entity.tags.name.length;
                p = {};

            if (entitywidth < w + 20) return;
            p.x = centroid[0];
            p.y = centroid[1];
            p.textAnchor = 'middle';
            var rect = new RTree.Rectangle(p.x - w/2, p.y, w, 20);
            if (tryInsert(rect)) return p;

        }

        function tryInsert(rect) {
            var v = rtree.search(rect, true).length === 0;
            if (v) rtree.insert(rect);
            return v;
        }

        function pointposition(attr) {
            return function(d, i) { return positions['point'][i][attr] };
        }
        function lineposition(attr) {
            return function(d, i) { return positions['line'][i][attr] };
        }
        function areaposition(attr) {
            return function(d, i) { return positions['area'][i][attr] };
        }


        var label = surface.select('.layer-label'),
            points = drawPointLabels(label, labelled['point'], filter, 'text-label', pointposition),
            lines = drawLineLabels(label, labelled['line'], filter, 'textpath-label', lineposition),
            areas = drawPointLabels(label, labelled['area'], filter, 'text-arealabel', areaposition);
    };

};
