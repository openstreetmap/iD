import * as d3 from 'd3';
import _ from 'lodash';
import rbush from 'rbush';
import { geoPathLength } from '../geo/index';
import { osmEntity } from '../osm/index';
import { utilDetect } from '../util/detect';
import { utilDisplayName, utilEntitySelector } from '../util/index';


export function svgLabels(projection, context) {
    var path = d3.geoPath().projection(projection),
        rtree = rbush(),
        textWidthCache = {},
        bboxes = {};

    // Replace with dict and iterate over entities tags instead?
    var label_stack = [
        ['line', 'aeroway', 12],
        ['line', 'highway', 12],
        ['line', 'railway', 12],
        ['line', 'waterway', 12],
        ['area', 'aeroway', 12],
        ['area', 'amenity', 12],
        ['area', 'building', 12],
        ['area', 'historic', 12],
        ['area', 'leisure', 12],
        ['area', 'man_made', 12],
        ['area', 'natural', 12],
        ['area', 'shop', 12],
        ['area', 'tourism', 12],
        ['point', 'aeroway', 10],
        ['point', 'amenity', 10],
        ['point', 'building', 10],
        ['point', 'historic', 10],
        ['point', 'leisure', 10],
        ['point', 'man_made', 10],
        ['point', 'natural', 10],
        ['point', 'shop', 10],
        ['point', 'tourism', 10],
        ['line', 'name', 12],
        ['area', 'name', 12],
        ['point', 'name', 10]
    ];



    function blacklisted(preset) {
        var noIcons = ['building', 'landuse', 'natural'];
        return _.some(noIcons, function(s) {
            return preset.id.indexOf(s) >= 0;
        });
    }


    function get(array, prop) {
        return function(d, i) { return array[i][prop]; };
    }


    function textWidth(text, size, elem) {
        var c = textWidthCache[size];
        if (!c) c = textWidthCache[size] = {};

        if (c[text]) {
            return c[text];

        } else if (elem) {
            c[text] = elem.getComputedTextLength();
            return c[text];

        } else {
            var str = encodeURIComponent(text).match(/%[CDEFcdef]/g);
            if (str === null) {
                return size / 3 * 2 * text.length;
            } else {
                return size / 3 * (2 * text.length + str.length);
            }
        }
    }


    function drawLinePaths(selection, entities, filter, classes, labels) {
        var paths = selection.selectAll('path')
            .filter(filter)
            .data(entities, osmEntity.key);

        paths.exit()
            .remove();

        paths.enter()
            .append('path')
            .style('stroke-width', get(labels, 'font-size'))
            .attr('id', function(d) { return 'labelpath-' + d.id; })
            .attr('class', classes)
            .merge(paths)
            .attr('d', get(labels, 'lineString'));
    }


    function drawLineLabels(selection, entities, filter, classes, labels) {
        var texts = selection.selectAll('text.' + classes)
            .filter(filter)
            .data(entities, osmEntity.key);

        texts.exit()
            .remove();

        texts.enter()
            .append('text')
            .attr('class', function(d, i) { return classes + ' ' + labels[i].classes + ' ' + d.id; })
            .append('textPath')
            .attr('class', 'textpath');

        texts = selection.selectAll('text.' + classes);

        texts.selectAll('.textpath')
            .filter(filter)
            .data(entities, osmEntity.key)
            .attr('startOffset', '50%')
            .attr('xlink:href', function(d) { return '#labelpath-' + d.id; })
            .text(utilDisplayName);
    }


    function drawPointLabels(selection, entities, filter, classes, labels) {
        var texts = selection.selectAll('text.' + classes)
            .filter(filter)
            .data(entities, osmEntity.key);

        texts.exit()
            .remove();

        texts = texts.enter()
            .append('text')
            .attr('class', function(d, i) {
                return classes + ' ' + labels[i].classes + ' ' + d.id;
            })
            .merge(texts);

        texts
            .attr('x', get(labels, 'x'))
            .attr('y', get(labels, 'y'))
            .style('text-anchor', get(labels, 'textAnchor'))
            .text(utilDisplayName)
            .each(function(d, i) {
                textWidth(utilDisplayName(d), labels[i].height, this);
            });
    }


    function drawAreaLabels(selection, entities, filter, classes, labels) {
        entities = entities.filter(hasText);
        labels = labels.filter(hasText);
        drawPointLabels(selection, entities, filter, classes, labels);

        function hasText(d, i) {
            return labels[i].hasOwnProperty('x') && labels[i].hasOwnProperty('y');
        }
    }


    function drawAreaIcons(selection, entities, filter, classes, labels) {
        var icons = selection.selectAll('use')
            .filter(filter)
            .data(entities, osmEntity.key);

        icons.exit()
            .remove();

        icons = icons.enter()
            .append('use')
            .attr('class', 'icon areaicon')
            .attr('width', '18px')
            .attr('height', '18px')
            .merge(icons);

        icons
            .attr('transform', get(labels, 'transform'))
            .attr('xlink:href', function(d) {
                var icon = context.presets().match(d, context.graph()).icon;
                return '#' + icon + (icon === 'hairdresser' ? '-24': '-18');    // workaround: maki hairdresser-18 broken?
            });
    }


    function reverse(p) {
        var angle = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
        return !(p[0][0] < p[p.length - 1][0] && angle < Math.PI/2 && angle > -Math.PI/2);
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


    function drawLabels(selection, graph, entities, filter, dimensions, fullRedraw) {
        var hidePoints = !selection.selectAll('.node.point').node();

        var labelable = [], i, k, entity;
        for (i = 0; i < label_stack.length; i++) {
            labelable.push([]);
        }

        if (fullRedraw) {
            rtree.clear();
            bboxes = {};
        } else {
            for (i = 0; i < entities.length; i++) {
                rtree.remove(bboxes[entities[i].id]);
            }
        }

        // Split entities into groups specified by label_stack
        for (i = 0; i < entities.length; i++) {
            entity = entities[i];
            var geometry = entity.geometry(graph);

            if (geometry === 'vertex')
                continue;
            if (hidePoints && geometry === 'point')
                continue;

            var preset = geometry === 'area' && context.presets().match(entity, graph),
                icon = preset && !blacklisted(preset) && preset.icon;

            if (!icon && !utilDisplayName(entity))
                continue;

            for (k = 0; k < label_stack.length; k++) {
                if (geometry === label_stack[k][0] && entity.tags[label_stack[k][1]]) {
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
            var font_size = label_stack[k][2];
            for (i = 0; i < labelable[k].length; i++) {
                entity = labelable[k][i];
                var name = utilDisplayName(entity),
                    width = name && textWidth(name, font_size),
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
            var pointOffsets = {
                    ltr: [15, -10, 'start'],
                    rtl: [-15, -10, 'end']
                };

            var coord = projection(entity.loc),
                margin = 5,
                textDirection = utilDetect().textDirection,
                offset = pointOffsets[textDirection],
                p = {
                    height: height,
                    width: width,
                    x: coord[0] + offset[0],
                    y: coord[1] + offset[1],
                    textAnchor: offset[2]
                },
                bbox;

            if (textDirection === 'rtl') {
                bbox = {
                    minX: p.x - width - margin,
                    minY: p.y - height - margin,
                    maxX: p.x + margin,
                    maxY: p.y + margin
                };
            } else {
                bbox = {
                    minX: p.x - margin,
                    minY: p.y + margin,
                    maxX: p.x + width + margin,
                    maxY: p.y - height - margin
                };
            }

            if (tryInsert(bbox, entity.id)) {
                return p;
            }
        }


        function getLineLabel(entity, width, height) {
            var nodes = _.map(graph.childNodes(entity), 'loc').map(projection),
                length = geoPathLength(nodes);
            if (length < width + 20) return;

            // What sorcery is this?
            var lineOffsets = [50, 45, 55, 40, 60, 35, 65, 30, 70, 25,
                75, 20, 80, 15, 95, 10, 90, 5, 95];

            for (var i = 0; i < lineOffsets.length; i++) {
                var offset = lineOffsets[i],
                    middle = offset / 100 * length,
                    start = middle - width / 2;

                if (start < 0 || start + width > length) continue;

                var sub = subpath(nodes, start, start + width),
                    rev = reverse(sub),
                    bbox = {
                        minX: Math.min(sub[0][0], sub[sub.length - 1][0]) - 10,
                        minY: Math.min(sub[0][1], sub[sub.length - 1][1]) - 10,
                        maxX: Math.max(sub[0][0], sub[sub.length - 1][0]) + 20,
                        maxY: Math.max(sub[0][1], sub[sub.length - 1][1]) + 30
                    };

                if (rev) {
                    sub = sub.reverse();
                }
                if (tryInsert(bbox, entity.id)) {
                    return {
                        'font-size': height + 2,
                        lineString: lineString(sub),
                        startOffset: offset + '%'
                    };
                }
            }
        }


        function getAreaLabel(entity, width, height) {
            var centroid = path.centroid(entity.asGeoJSON(graph, true)),
                extent = entity.extent(graph),
                entitywidth = projection(extent[1])[0] - projection(extent[0])[0],
                bbox;

            if (isNaN(centroid[0]) || entitywidth < 20) return;

            var iconSize = 18,
                iconX = centroid[0] - (iconSize / 2),
                iconY = centroid[1] - (iconSize / 2),
                textOffset = iconSize + 5,
                p = { transform: 'translate(' + iconX + ',' + iconY + ')' };

            if (width && entitywidth >= width + 20) {
                p.x = centroid[0];
                p.y = centroid[1] + textOffset;
                p.textAnchor = 'middle';
                p.height = height;
                bbox = { minX: p.x - width/2, minY: p.y, maxX: p.x + width/2, maxY: p.y + height + textOffset };
            } else {
                bbox = { minX: iconX, minY: iconY, maxX: iconX + iconSize, maxY: iconY + iconSize };
            }

            if (tryInsert(bbox, entity.id)) {
                return p;
            }
        }


        function tryInsert(bbox, id) {
            // Check that label is visible
            if (bbox.minX < 0 || bbox.minY < 0 || bbox.maxX > dimensions[0] || bbox.maxY > dimensions[1]) return false;
            var v = rtree.search(bbox).length === 0;
            if (v) {
                bbox.id = id;
                rtree.insert(bbox);
                bboxes[id] = bbox;
            }
            return v;
        }

        var label = selection.selectAll('.layer-label'),
            halo = selection.selectAll('.layer-halo');

        // points
        drawPointLabels(label, labelled.point, filter, 'pointlabel', positions.point);
        drawPointLabels(halo, labelled.point, filter, 'pointlabel-halo', positions.point);

        // lines
        drawLinePaths(halo, labelled.line, filter, '', positions.line);
        drawLineLabels(label, labelled.line, filter, 'linelabel', positions.line);
        drawLineLabels(halo, labelled.line, filter, 'linelabel-halo', positions.line);

        // areas
        drawAreaLabels(label, labelled.area, filter, 'arealabel', positions.area);
        drawAreaLabels(halo, labelled.area, filter, 'arealabel-halo', positions.area);
        drawAreaIcons(label, labelled.area, filter, 'arealabel-icon', positions.area);

        // debug
        var showDebug = true; //context.getDebug('collision');
        var debug = label.selectAll('.layer-label-debug')
            .data(showDebug ? [true] : []);

        debug.exit()
            .remove();

        debug = debug.enter()
            .append('g')
            .attr('class', 'layer-label-debug')
            .merge(debug);

        if (showDebug) {
            var gj = rtree.all().map(function(d) {
                return { type: 'Polygon', coordinates: [[
                    [d.minX, d.minY],
                    [d.maxX, d.minY],
                    [d.maxX, d.maxY],
                    [d.minX, d.maxY],
                    [d.minX, d.minY]
                ]]};
            });

            var debugboxes = debug.selectAll('.debug')
                .data(gj);

            debugboxes.exit()
                .remove();

            debugboxes = debugboxes.enter()
                .append('path')
                .attr('class', 'debug yellow')
                .merge(debugboxes);

            debugboxes
                .attr('d', d3.geoPath().projection(null));
        }
    }


    function hideOnMouseover() {
        if (d3.event.buttons) return;

        var layers = d3.select(this)
            .selectAll('.layer-label, .layer-halo');

        layers.selectAll('.proximate')
            .classed('proximate', false);

        var mouse = context.mouse(),
            pad = 20,
            bbox = { minX: mouse[0] - pad, minY: mouse[1] - pad, maxX: mouse[0] + pad, maxY: mouse[1] + pad },
            ids = _.map(rtree.search(bbox), 'id');

        layers.selectAll(utilEntitySelector(ids))
            .classed('proximate', true);
    }


    drawLabels.observe = function(selection) {
        selection.on('mousemove.hidelabels', hideOnMouseover);
    };


    drawLabels.off = function(selection) {
        selection.on('mousemove.hidelabels', null);
    };


    return drawLabels;
}
