iD.svg.Labels = function(projection) {

    // Replace with dict and iterate over entities tags instead?
    var label_stack = [
        ['line', 'aeroway'],
        ['line', 'highway'],
        ['line', 'railway'],
        ['line', 'waterway'],
        ['area', 'aeroway'],
        ['area', 'amenity'],
        ['area', 'building'],
        ['area', 'historic'],
        ['area', 'leisure'],
        ['area', 'man_made'],
        ['area', 'natural'],
        ['area', 'shop'],
        ['area', 'tourism'],
        ['point', 'aeroway'],
        ['point', 'amenity'],
        ['point', 'building'],
        ['point', 'historic'],
        ['point', 'leisure'],
        ['point', 'man_made'],
        ['point', 'natural'],
        ['point', 'shop'],
        ['point', 'tourism'],
        ['line', 'name'],
        ['area', 'name'],
        ['point', 'name']
    ];

    var default_size = 12;
    var font_sizes = label_stack.map(function(d) {
        var style = iD.util.getStyle('text.' + d[0] + '.tag-' + d[1]);
        var m = style && style.cssText.match("font-size: ([0-9]{1,2})px;");
        if (m) return parseInt(m[1], 10);
        style = iD.util.getStyle('text.' + d[0]);
        m = style && style.cssText.match("font-size: ([0-9]{1,2})px;");
        if (m) return parseInt(m[1], 10);
        return default_size;
    });

    var pointOffsets = [
        [15, 3, 'start'], // right
        [10, 0, 'start'], // unused right now
        [-15, 0, 'end']
    ];

    var lineOffsets = [50, 45, 55, 40, 60, 35, 65, 30, 70, 25,
        75, 20, 80, 15, 95, 10, 90, 5, 95];

    function get(array, prop) {
        return function(d, i) { return array[i][prop]; };
    }

    var textWidthCache = {};
    function textWidth(text, size, elem) {
        var c = textWidthCache[size];
        if (!c) c = textWidthCache[size] = {};
        if (c[text]) return c[text];
        else if (elem) return c[text] = elem.getComputedTextLength();
        else return size / 3 * 2 * text.length;
    }

    function drawLineLabels(group, entities, filter, classes, labels) {

        var texts = group.selectAll('text.' + classes)
            .filter(filter)
            .data(entities, iD.Entity.key);

        var tp = texts.enter()
            .append('text')
            .attr('class', function(d, i) { return classes + ' ' + labels[i].classes;})
            .append('textPath')
            .attr('class', 'textpath');


        var tps = texts.selectAll('.textpath')
            .filter(filter)
            .data(entities, iD.Entity.key)
            .attr({
                'startOffset': '50%',
                'xlink:href': function(d, i) { return '#halo-' + d.id; }
            })
            .text(function(d, i) { return d.tags.name; });

        texts.exit().remove();

    }

    function drawLineHalos(group, entities, filter, classes, labels) {

        var halos = group.selectAll('path')
            .filter(filter)
            .data(entities, iD.Entity.key);

        halos.enter()
            .append('path')
            .style('stroke-width', get(labels, 'font-size'))
            .attr('id', function(d, i) { return 'halo-' + d.id; })
            .attr('class', classes);

        halos.attr('d', get(labels, 'lineString'));

        halos.exit().remove();
    }

    function drawPointHalos(group, entities, filter, classes, labels) {

        var halos = group.selectAll('rect.' + classes)
            .filter(filter)
            .data(entities, iD.Entity.key);

        halos.enter()
            .append('rect')
            .attr('class', function(d, i) { return classes + ' ' + labels[i].classes;});

        halos.attr({
            'x': function(d, i) {
                var x = labels[i].x - 2;
                if (labels[i].textAnchor === 'middle') {
                    x -= textWidth(d.tags.name, labels[i].height) / 2;
                }
                return x;
            },
            'y': function(d, i) { return labels[i].y - labels[i].height + 1 - 2; },
            'rx': 3,
            'ry': 3,
            'width': function(d, i) { return textWidth(d.tags.name, labels[i].height) + 4; },
            'height': function(d, i) { return labels[i].height + 4; },
            'fill': 'white'
        });

        halos.exit().remove();
    }


    function drawPointLabels(group, entities, filter, classes, labels) {

        var texts = group.selectAll('text.' + classes)
            .filter(filter)
            .data(entities, iD.Entity.key);

        texts.enter()
            .append('text')
            .attr('class', function(d, i) { return classes + ' ' + labels[i].classes; });

        texts.attr('x', get(labels, 'x'))
            .attr('y', get(labels, 'y'))
            .attr('transform', get(labels, 'transform'))
            .style('text-anchor', get(labels, 'textAnchor'))
            .text(function(d) { return d.tags.name; })
            .each(function(d, i) { textWidth(d.tags.name, labels[i].height, this); });

        texts.exit().remove();
        return texts;
    }

    function reverse(p) {
        var angle = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
        return !(p[0][0] < p[p.length - 1][0] && angle < Math.PI/2 && angle > - Math.PI/2);
    }

    function lineString(nodes) {
        return 'M' + nodes.join('L');
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
            var portion;
            if (!start && sofar + current >= from) {
                portion = (from - sofar) / current;
                start = [
                    nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                    nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                ];
                i0 = i + 1;
            }
            if (!end && sofar + current >= to) {
                portion = (to - sofar) / current;
                end = [
                    nodes[i][0] + portion * (nodes[i + 1][0] - nodes[i][0]),
                    nodes[i][1] + portion * (nodes[i + 1][1] - nodes[i][1])
                ];
                i1 = i + 1;
            }
            sofar += current;

        }
        var ret = nodes.slice(i0, i1);
        ret.unshift(start);
        ret.push(end);
        return ret;

    }

    function hideOnMouseover() {
        var mouse = d3.mouse(this),
            pad = 50,
            rect = new RTree.Rectangle(mouse[0] - pad, mouse[1] - pad, 2*pad, 2*pad),
            labels = _.pluck(rtree.search(rect, this), 'leaf'),
            selection = d3.select(this);

        selection.selectAll('.layer-label text, .layer-halo path, .layer-halo rect')
            .style('opacity', '');

        if (!labels.length) return;
        selection.selectAll('.layer-label text, .layer-halo path, .layer-halo rect')
            .filter(function(d) {
                return _.contains(labels, d.id);
            })
            .style('opacity', 0);
    }

    var rtree = new RTree(),
        rectangles = {};

    return function drawLabels(surface, graph, entities, filter, dimensions, fullRedraw) {

        d3.select(surface.node().parentNode)
            .on('mousemove.hidelabels', hideOnMouseover);

        var hidePoints = !surface.select('.node.point').node();

        var labelable = [], i, k, entity;
        for (i = 0; i < label_stack.length; i++) labelable.push([]);

        if (fullRedraw) {
            rtree = new RTree();
            rectangles = {};
        } else {
            for (i = 0; i < entities.length; i++) {
                rtree.remove(rectangles[entities[i].id], entities[i].id);
            }
        }

        // Split entities into groups specified by label_stack
        for (i = 0; i < entities.length; i++) {
            entity = entities[i];
            if (!entity.tags.name) continue;
            if (hidePoints && entity.geometry(graph) === 'point') continue;
            for (k = 0; k < label_stack.length; k ++) {
                if (entity.geometry(graph) === label_stack[k][0] &&
                    entity.tags[label_stack[k][1]]) {
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

        // Try and find a valid label for labellable entities
        for (k = 0; k < labelable.length; k++) {
            var font_size = font_sizes[k];
            for (i = 0; i < labelable[k].length; i ++) {
                entity = labelable[k][i];
                var width = textWidth(entity.tags.name, font_size),
                    p;
                if (entity.geometry(graph) === 'point') {
                    p = getPointLabel(entity, width, font_size);
                } else if (entity.geometry(graph) === 'line') {
                    p = getLineLabel(entity, width, font_size);
                } else if (entity.geometry(graph) === 'area') {
                    p = getAreaLabel(entity, width, font_size);
                }
                if (p) {
                    p.classes = entity.geometry(graph) + ' tag-' + label_stack[k][1];
                    positions[entity.geometry(graph)].push(p);
                    labelled[entity.geometry(graph)].push(entity);
                }
            }
        }

        function getPointLabel(entity, width, height) {
            var coord = projection(entity.loc),
                m = 5,  // margin
                offset = pointOffsets[0],
                p = {
                    height: height,
                    width: width,
                    x: coord[0] + offset[0],
                    y: coord[1] + offset[1],
                    textAnchor: offset[2]
                };
            var rect = new RTree.Rectangle(p.x - m, p.y - m, width + 2*m, height + 2*m);
            if (tryInsert(rect, entity.id)) return p;
        }


        function getLineLabel(entity, width, height) {
            var nodes = _.pluck(graph.childNodes(entity), 'loc').map(projection),
                length = iD.geo.pathLength(nodes);
            if (length < width + 20) return;

            for (var i = 0; i < lineOffsets.length; i ++) {
                var offset = lineOffsets[i],
                    middle = offset / 100 * length,
                    start = middle - width/2;
                if (start < 0 || start + width > length) continue;
                var sub = subpath(nodes, start, start + width),
                    rev = reverse(sub),
                    rect = new RTree.Rectangle(
                    Math.min(sub[0][0], sub[sub.length - 1][0]) - 10,
                    Math.min(sub[0][1], sub[sub.length - 1][1]) - 10,
                    Math.abs(sub[0][0] - sub[sub.length - 1][0]) + 20,
                    Math.abs(sub[0][1] - sub[sub.length - 1][1]) + 30
                );
                if (rev) sub = sub.reverse();
                if (tryInsert(rect, entity.id)) return {
                    'font-size': height + 2,
                    lineString: lineString(sub),
                    startOffset: offset + '%'
                };
            }
        }

        function getAreaLabel(entity, width, height) {
            var path = d3.geo.path().projection(projection),
                centroid = path.centroid(entity.asGeoJSON(graph)),
                extent = entity.extent(graph),
                entitywidth = projection(extent[1])[0] - projection(extent[0])[0];

            if (entitywidth < width + 20) return;
            var p = {
                x: centroid[0],
                y: centroid[1],
                textAnchor: 'middle',
                height: height
            };
            var rect = new RTree.Rectangle(p.x - width/2, p.y, width, height);
            if (tryInsert(rect, entity.id)) return p;

        }

        function tryInsert(rect, id) {
            // Check that label is visible
            if (rect.x1 < 0 || rect.y1 < 0 || rect.x2 > dimensions[0] ||
                rect.y2 > dimensions[1]) return false;
            var v = rtree.search(rect, true).length === 0;
            if (v) {
                rtree.insert(rect, id);
                rectangles[id] = rect;
            }
            return v;
        }

        var label = surface.select('.layer-label'),
            halo = surface.select('.layer-halo'),
            points = drawPointLabels(label, labelled.point, filter, 'pointlabel', positions.point),
            pointHalos = drawPointHalos(halo, labelled.point, filter, 'pointlabel-halo', positions.point),
            linesHalos = drawLineHalos(halo, labelled.line, filter, 'linelabel-halo', positions.line),
            lines = drawLineLabels(label, labelled.line, filter, 'pathlabel', positions.line),
            areas = drawPointLabels(label, labelled.area, filter, 'arealabel', positions.area),
            areaHalos = drawPointHalos(halo, labelled.area, filter, 'arealabel-halo', positions.area);
    };

};
