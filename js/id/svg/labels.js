iD.svg.Labels = function(projection) {

    // Replace with dict and iterate over entities tags instead?
    var label_stack = [
        ['line', 'highway'],
        ['area', 'building', 'yes'],
        ['area', 'leisure', 'park'],
        ['area', 'natural'],
        ['point', 'amenity'],
        ['point', 'shop'],
    ];

    var default_size = 12;
    var font_sizes = label_stack.map(function(d) {
        var style = iD.util.getStyle('text.' + d.join('-'));
        var m = style && style.cssText.match("font-size: ([0-9]{1,2})px;");
        if (!m) return default_size;
        return parseInt(m[1], 10);
    });

    var pointOffsets = [
        [10, 3, 'start'], // right
        [10, 0, 'start'],
        [-15, 0, 'end'], // left
    ];

    var lineOffsets = [
        50, 40, 60, 30, 70
    ];

    var textWidthCache = {};
    function textWidth(text, size, elem) {
        var c = textWidthCache[size];
        if (!c) c = textWidthCache[size] = {};
        if (c[text]) return c[text];
        else if (elem) return c[text] = elem.getComputedTextLength();
        else return size / 3 * 2 * text.length;
    }

    function drawLineLabels(group, labels, filter, classes, position) {

        var reverse = position('reverse'),
            getClasses = position('classes');

        var texts = group.selectAll('text.' + classes)
            .filter(filter)
            .data(labels, iD.Entity.key)

        var tp = texts.enter()
            .append('text')
            .attr({ 'class': function(d, i) { return classes + ' ' + getClasses(d, i);}})
            .append('textPath')
            .attr({
                'class': 'textpath'
            });


        var tps = group.selectAll('.textpath-label .textpath')
            .data(labels)
            .attr({
                'startOffset': position('startOffset'),
                'xlink:href': function(d, i) { return '#casing-' + d.id},
                'glyph-orientation-vertical': function(d, i) {return reverse(d, i) ? 180 : 0}, 
                'glyph-orientation-horizontal': function(d, i) {return reverse(d, i) ? 180 : 0},
                'dominant-baseline': 'middle'
            })
            .text(function(d, i) {
                return reverse(d, i) ? d.tags.name.split('').reverse().join('') : d.tags.name;
            });

        texts.exit().remove();

    }

    function drawPointHalos(group, labels, filter, classes, position) {

        var halos = group.selectAll('rect.' + classes)
            .filter(filter)
            .data(labels, iD.Entity.key);

        halos.enter()
            .insert('rect', '.text-label')
            .attr('class', function(d, i) { return classes + ' ' + position('classes')(d, i);});

        halos.attr({
            'x': function(d, i) {
                var x = position('x')(d, i) - 2;
                if (position('textAnchor')(d, i) === 'middle') {
                    x -= textWidth(d.tags.name, position('height')(d, i)) / 2;
                }
                return x;
            },
            'y': function(d, i) { return position('y')(d, i) - position('height')(d, i) + 1 - 2; },
            'width': function(d, i) { return textWidth(d.tags.name, position('height')(d, i)) + 4 },
            'height': function(d, i) { return position('height')(d, i) + 4 },
            'fill': 'white',
        });

        halos.exit().remove();
    }


    function drawPointLabels(group, labels, filter, classes, position) {
        var getClasses = position('classes');

        var texts = group.selectAll('text.' + classes)
            .filter(filter)
            .data(labels, iD.Entity.key);

        texts.enter()
            .append('text')
            .attr('class', function(d, i) { return classes + ' ' + getClasses(d, i);});

        texts.attr('x', position('x'))
            .attr('y', position('y'))
            .attr('transform', position('transform'))
            .style('text-anchor', position('textAnchor'))
            .text(function(d) { return d.tags.name })
            .each(function(d, i) { textWidth(d.tags.name, position('height')(d, i), this); });

        texts.exit().remove();
        return texts;
    }

    function reverse(p) {
        var angle = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]),
            reverse = !(p[0][0] < p[p.length - 1][0] && angle < Math.PI/2 && angle > - Math.PI/2);
        return reverse;
    }

    function subpath(nodes, from, to) {
        function segmentLength(i) {
            var dx = nodes[i][0] - nodes[i + 1][0];
            var dy = nodes[i][1] - nodes[i + 1][1];
            return Math.sqrt(dx * dx + dy * dy);
        }

        var sofar = 0,
            start, end, i0, i1;
        for (var i = 0; i < nodes.length - 1; i++) {
            var current = segmentLength(i);
            if (!start && sofar + current > from) {
                var portion = (from - sofar) / current;
                start = [
                    nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                    nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                ];
                i0 = i + 1;
            }
            if (!end && sofar + current > to) {
                var portion = (to - sofar) / current;
                end = [
                    nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                    nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                ];
                i1 = i;
            }
            sofar += current;

        }
        var ret = nodes.slice(i0, i1);
        ret.unshift(start);
        ret.push(end);
        return ret;

    }


    return function drawLabels(surface, graph, entities, filter) {

        var rtree = new RTree();
        var hidePoints = !d3.select('.point').node();

        var labelable = [];
        for (var i = 0; i < label_stack.length; i++) labelable.push([]);

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (!entity.tags.name) continue;
            if (hidePoints && entity.geometry() === 'point') continue;
            for (var k = 0; k < label_stack.length; k ++) {
                if (entity.geometry() === label_stack[k][0] &&
                    entity.tags[label_stack[k][1]] && !entity.tags[label_stack[k][2]]) {
                    labelable[k].push(entity);
                    break;
                }
            }
        }


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

        for (var k = 0; k < labelable.length; k++) {
            var font_size = font_sizes[k];
            for (var i = 0; i < labelable[k].length; i ++) {
                var entity = labelable[k][i],
                    width = textWidth(entity.tags.name, font_size),
                    p;
                if (entity.geometry() === 'point') {
                    p = getPointLabel(entity, width, font_size);
                } else if (entity.geometry() === 'line') {
                    p = getLineLabel(entity, width, font_size);
                } else if (entity.geometry() === 'area') {
                    p = getAreaLabel(entity, width, font_size);
                }
                if (p) {
                    p.classes = label_stack[k].join('-');
                    positions[entity.geometry()].push(p);
                    labelled[entity.geometry()].push(entity);
                }
            }
        }

        function getPointLabel(entity, width, height) {
            var coord = projection(entity.loc),
                offset = pointOffsets[0],
                p = {
                    height: height,
                    width: width,
                    x: coord[0] + offset[0],
                    y: coord[1] + offset[1],
                    textAnchor: offset[2]
                }
            var rect = new RTree.Rectangle(p.x, p.y, width, height);
            if (tryInsert(rect)) return p;
        }

        function getLineLabel(entity, width, height) {
            var nodes = _.pluck(entity.nodes, 'loc').map(projection),
                length = iD.util.geo.pathLength(nodes);
            if (length < width + 20) return;

            // 50, 40, 60, 30, 70
            for (var i = 0; i < 5; i ++) {
                var offset = lineOffsets[i],
                    middle = offset / 100 * length;
                if (middle <= width / 2) return;
                var start = middle - width/2,
                    sub = subpath(nodes, start, start + width),
                    rev = reverse(sub),
                    rect = new RTree.Rectangle(
                    Math.min(sub[0][0], sub[sub.length - 1][0]) - 10,
                    Math.min(sub[0][1], sub[sub.length - 1][1]) - 10,
                    Math.abs(sub[0][0] - sub[sub.length - 1][0]) + 20,
                    Math.abs(sub[0][1] - sub[sub.length - 1][1]) + 30
                );
                if (tryInsert(rect)) return {
                    'font-size': height,
                    reverse: rev,
                    startOffset: offset + '%'
                }
            }
        }

        function getAreaLabel(entity, width, height) {
            var nodes = _.pluck(entity.nodes, 'loc')
                .map(iD.svg.RoundProjection(projection)),
                centroid = iD.util.geo.polygonCentroid(nodes),
                extent = entity.extent(graph),
                entitywidth = projection(extent[1])[0] - projection(extent[0])[0];

            if (entitywidth < width + 20) return;
            var p = {
                x: centroid[0],
                y: centroid[1],
                textAnchor: 'middle',
                height: height
            }
            var rect = new RTree.Rectangle(p.x - width/2, p.y, width, height);
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
            pointHalos = drawPointHalos(label, labelled['point'], filter, 'point-label-halo', pointposition),
            lines = drawLineLabels(label, labelled['line'], filter, 'textpath-label', lineposition),
            areas = drawPointLabels(label, labelled['area'], filter, 'text-arealabel', areaposition),
            areaHalos = drawPointHalos(label, labelled['area'], filter, 'area-label-halo', areaposition);
    };

};
