import * as d3 from 'd3';
import _ from 'lodash';
import rbush from 'rbush';
import { dataFeatureIcons } from '../../data/index';
import { textDirection } from '../util/locale';

import {
    geoChooseEdge,
    geoExtent,
    geoEuclideanDistance,
    geoInterp,
    geoPolygonIntersectsPolygon,
    geoPathLength
} from '../geo';

import { osmEntity } from '../osm';
import { utilDetect } from '../util/detect';

import {
    utilDisplayName,
    utilDisplayNameForPath,
    utilDisplayHousenumber,
    utilEntitySelector
} from '../util';


export function svgLabels(projection, context) {
    var path = d3.geoPath(projection),
        detected = utilDetect(),
        baselineHack = (detected.ie || detected.browser.toLowerCase() === 'edge'),
        rdrawn = rbush(),
        rskipped = rbush(),
        textWidthCache = {},
        entitybboxes = {};

    /**
     * @typedef {Array} LabelProps
     * @property {String} LabelProps[0] - Match geometry
     * @property {String} LabelProps[1] - Match tag key
     * @property {String} LabelProps[2] - Match tag value ('*' - any)
     * @property {Number} LabelProps[3] - Font size
     *
     * @type {Array.<LabelProps>} - Named objects matching list from highest to lowest priority
     */
    var nameLabelStack = [
        ['line', 'aeroway', '*', 12],
        ['line', 'highway', 'motorway', 12],
        ['line', 'highway', 'trunk', 12],
        ['line', 'highway', 'primary', 12],
        ['line', 'highway', 'secondary', 12],
        ['line', 'highway', 'tertiary', 12],
        ['line', 'highway', '*', 12],
        ['line', 'railway', '*', 12],
        ['line', 'waterway', '*', 12],
        ['area', 'aeroway', '*', 12],
        ['area', 'amenity', '*', 12],
        ['area', 'building', '*', 12],
        ['area', 'historic', '*', 12],
        ['area', 'leisure', '*', 12],
        ['area', 'man_made', '*', 12],
        ['area', 'natural', '*', 12],
        ['area', 'shop', '*', 12],
        ['area', 'tourism', '*', 12],
        ['area', 'camp_site', '*', 12],
        ['point', 'aeroway', '*', 10],
        ['point', 'amenity', '*', 10],
        ['point', 'building', '*', 10],
        ['point', 'historic', '*', 10],
        ['point', 'leisure', '*', 10],
        ['point', 'man_made', '*', 10],
        ['point', 'natural', '*', 10],
        ['point', 'shop', '*', 10],
        ['point', 'tourism', '*', 10],
        ['point', 'camp_site', '*', 10],
        ['line', 'name', '*', 12],
        ['area', 'name', '*', 12],
        ['point', 'name', '*', 10]
    ];

    var housenumberFontSize = 10;


    function blacklisted(preset) {
        var noIcons = ['building', 'landuse', 'natural'];
        return _.some(noIcons, function(s) {
            return preset.id.indexOf(s) >= 0;
        });
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


    function drawLinePaths(selection, labelled, filter, classes) {
        var paths = selection.selectAll('path')
            .filter(function (labelData) { return filter(labelData.entity); })
            .data(labelled, function (labelData) { return osmEntity.key(labelData.entity); });

        paths.exit()
            .remove();

        paths.enter()
            .append('path')
            .style('stroke-width', function (labelData) { return labelData.position['font-size']; })
            .attr('id', function(labelData) { return 'labelpath-' + labelData.entity.id; })
            .attr('class', classes)
            .merge(paths)
            .attr('d', function (labelData) { return labelData.position.lineString; });
    }


    function drawLineLabels(selection, labelled, filter, classes) {
        var texts = selection.selectAll('text.' + classes)
            .filter(function (labelData) { return filter(labelData.entity); })
            .data(labelled, function (labelData) { return osmEntity.key(labelData.entity); });

        texts.exit()
            .remove();

        texts.enter()
            .append('text')
            .attr('class', function(labelData) {
                return classes + ' ' + labelData.classes + ' ' + labelData.entity.id;
            })
            .attr('dy', baselineHack ? '0.35em' : null)
            .append('textPath')
            .attr('class', 'textpath');

        texts = selection.selectAll('text.' + classes);

        texts.selectAll('.textpath')
            .filter(function (labelData) { return filter(labelData.entity); })
            .data(labelled, function (labelData) { return osmEntity.key(labelData.entity); })
            .attr('startOffset', '50%')
            .attr('xlink:href', function(labelData) { return '#labelpath-' + labelData.entity.id; })
            .text(function (labelData) { return labelData.name; });
    }


    function drawPointLabels(selection, labelled, filter, classes) {
        var texts = selection.selectAll('text.' + classes)
            .filter(function (labelData) { return filter(labelData.entity); })
            .data(labelled, function (labelData) { return osmEntity.key(labelData.entity); });

        texts.exit()
            .remove();

        texts = texts.enter()
            .append('text')
            .attr('class', function(labelData) {
                return classes + ' ' + labelData.classes + ' ' + labelData.entity.id;
            })
            .merge(texts);

        texts
            .attr('x', function (labelData) { return labelData.position.x; })
            .attr('y', function (labelData) { return labelData.position.y; })
            .style('text-anchor', function (labelData) { return labelData.position.textAnchor; })
            .text(function (labelData) { return labelData.name; })
            .each(function(labelData) {
                textWidth(labelData.name, labelData.position.height, this);
            });
    }


    function drawAreaLabels(selection, labelled, filter, classes) {
        labelled = labelled.filter(function (labelData) {
            return labelData.position.hasOwnProperty('x') && labelData.position.hasOwnProperty('y');
        });

        drawPointLabels(selection, labelled, filter, classes);
    }


    function drawAreaIcons(selection, labelled, filter, classes) {
        var icons = selection.selectAll('use.' + classes)
            .filter(function (labelData) { return filter(labelData.entity); })
            .data(labelled, function (labelData) { return osmEntity.key(labelData.entity); });

        icons.exit()
            .remove();

        icons = icons.enter()
            .append('use')
            .attr('class', 'icon ' + classes)
            .attr('width', '17px')
            .attr('height', '17px')
            .merge(icons);

        icons
            .attr('transform', function (labelData) { return labelData.position.transform; })
            .attr('xlink:href', function(labelData) {
                var preset = context.presets().match(labelData.entity, context.graph()),
                    picon = preset && preset.icon;

                if (!picon)
                    return '';
                else {
                    var isMaki = dataFeatureIcons.indexOf(picon) !== -1;
                    return '#' + picon + (isMaki ? '-15' : '');
                }
            });
    }


    function drawCollisionBoxes(selection, rtree, which) {
        var showDebug = context.getDebug('collision'),
            classes = 'debug ' + which + ' ' +
                (which === 'debug-skipped' ? 'orange' : 'yellow');

        var debug = selection.selectAll('.layer-label-debug')
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

            var debugboxes = debug.selectAll('.' + which)
                .data(gj);

            debugboxes.exit()
                .remove();

            debugboxes = debugboxes.enter()
                .append('path')
                .attr('class', classes)
                .merge(debugboxes);

            debugboxes
                .attr('d', d3.geoPath());
        }
    }


    function drawLabels(selection, graph, entities, filter, dimensions, fullRedraw) {
        var lowZoom = context.surface().classed('low-zoom'),
            i, j, k,
            entity, geometry, originalGeometry,
            name, housenumber, street,
            width, p;

        /**
         * @typedef {Object} NameLabelData
         * @property {osmEntity} entity
         * @property {String}    name - Display name
         *
         * @type {Array.< Array.<NameLabelData> >} - Array of labelable names from highest to lowest priority
         */
        var labelableNames = [];
        for (i = 0; i < nameLabelStack.length; i++) {
            labelableNames.push([]);
        }

        var labelableHousenumbers = [];
        var streetsWaysNodes = {};

        if (fullRedraw) {
            rdrawn.clear();
            rskipped.clear();
            entitybboxes = {};
        } else {
            for (i = 0; i < entities.length; i++) {
                entity = entities[i];
                var toRemove = []
                    .concat(entitybboxes[entity.id] || [])
                    .concat(entitybboxes[entity.id + 'I'] || [])
                    .concat(entitybboxes[entity.id + 'H'] || []);

                for (j = 0; j < toRemove.length; j++) {
                    rdrawn.remove(toRemove[j]);
                    rskipped.remove(toRemove[j]);
                }
            }
        }

        for (i = 0; i < entities.length; i++) {
            entity = entities[i];
            originalGeometry = entity.geometry(graph);
            geometry = originalGeometry === 'vertex' ? 'point' : originalGeometry;

            // Split entities into groups specified by nameLabelStack
            var preset = geometry === 'area' && context.presets().match(entity, graph),
                icon = preset && !blacklisted(preset) && preset.icon,
                getName = (geometry === 'line') ? utilDisplayNameForPath : utilDisplayName;

            name = getName(entity);

            if (!(originalGeometry === 'vertex' && lowZoom) // don't label vertices at low zoom because they don't have icons
                && (icon || name)) {
                for (k = 0; k < nameLabelStack.length; k++) {
                    var matchGeom = nameLabelStack[k][0],
                        matchKey = nameLabelStack[k][1],
                        matchVal = nameLabelStack[k][2],
                        hasVal = entity.tags[matchKey];

                    if (geometry === matchGeom && hasVal && (matchVal === '*' || matchVal === hasVal)) {
                        labelableNames[k].push({ entity: entity, name: name });
                        break;
                    }
                }
            }

            // Collect entities with housenumbers
            housenumber = utilDisplayHousenumber(entity);
            street = entity.tags['addr:street'];

            // TODO: include vertexes and points in building areas
            if (geometry === 'area' && housenumber && street) {
                labelableHousenumbers.push({
                    entity: entity,
                    housenumber: housenumber,
                    street: street
                });
            }

            // Collect street ways for best position of housenumbers
            street = entity.tags.name;
            if (geometry === 'line' && street) {
                if (streetsWaysNodes[street]) {
                    streetsWaysNodes[street].push(graph.childNodes(entity));
                } else {
                    streetsWaysNodes[street] = [ graph.childNodes(entity) ];
                }
            }
        }

        /**
         * @typedef {Object} PointLabelPosition
         * @typedef {Object} LineLabelPosition
         * @typedef {Object} AreaLabelPosition
         *
         * @type {Object}
         * @property {Array.< {entity: osmEntity, name: String, classes: String, position: PointLabelPosition} >} point
         * @property {Array.< {entity: osmEntity, name: String, classes: String, position: LineLabelPosition} >} line
         * @property {Array.< {entity: osmEntity, name: String, classes: String, position: AreaLabelPosition} >} area
         */
        var labelled = {
            point: [],
            line: [],
            area: []
        };

        // Try and find a valid label for labellable entities
        for (k = 0; k < labelableNames.length; k++) {
            var fontSize = nameLabelStack[k][3];
            for (i = 0; i < labelableNames[k].length; i++) {
                entity = labelableNames[k][i].entity;
                name = labelableNames[k][i].name;
                geometry = entity.geometry(graph);

                width = textWidth(name, fontSize);
                p = null;

                switch (geometry) {
                    case 'point':
                    case 'vertex':
                        p = getPointLabel(entity, width, fontSize, geometry);
                        break;
                    case 'line':
                        p = getLineLabel(getLinestring(entity), entity.id, width, fontSize);
                        break;
                    case 'area':
                        p = getAreaLabel(entity, width, fontSize);
                        break;
                }

                if (p) {
                    if (geometry === 'vertex') { geometry = 'point'; }  // treat vertex like point
                    labelled[geometry].push({
                        entity: entity,
                        name: name,
                        classes: geometry + ' tag-' + nameLabelStack[k][1],
                        position: p
                    });
                }
            }
        }

        for (k = 0; k < labelableHousenumbers.length; k++) {
            entity = labelableHousenumbers[k].entity;
            housenumber = labelableHousenumbers[k].housenumber;
            street = labelableHousenumbers[k].street;

            width = textWidth(housenumber, housenumberFontSize);
            p = null;

            var nodes = getLinestring(entity),
                streetWaysNodes = streetsWaysNodes[street],
                nearestEdge, midpoint, distance, bestDistance = Infinity;

            if (!streetWaysNodes) {
                nearestEdge = nodes;
            } else {
                // Search for nearest edge
                for (i = 0; i < nodes.length -1; i++) {
                    midpoint = [ (nodes[i][0] + nodes[i+1][0]) / 2, (nodes[i][1] + nodes[i+1][1]) / 2 ];

                    for (j = 0; j < streetWaysNodes.length; j++) {
                        distance = geoChooseEdge(streetWaysNodes[j], midpoint, projection).distance;

                        if (distance < bestDistance) {
                            nearestEdge = [nodes[i], nodes[i+1]];
                            bestDistance = distance;
                        }
                    }
                }
            }

            p = getLineLabel(nearestEdge, entity.id + 'H', width, housenumberFontSize);

            if (p) {
                labelled.line.push({ entity: entity, name: housenumber, classes: 'housenumber', position: p });
            }

        }


        function getLinestring (way) {
            return graph.childNodes(way).map(function (node) {
                return projection(node.loc);
            });
        }


        /**
         * @returns {PointLabelPosition}
         */
        function getPointLabel(entity, width, height, geometry) {
            var y = (geometry === 'point' ? -12 : 0),
                pointOffsets = {
                    ltr: [15, y, 'start'],
                    rtl: [-15, y, 'end']
                };

            var coord = projection(entity.loc),
                margin = 2,
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
                    minY: p.y - (height / 2) - margin,
                    maxX: p.x + margin,
                    maxY: p.y + (height / 2) + margin
                };
            } else {
                bbox = {
                    minX: p.x - margin,
                    minY: p.y - (height / 2) - margin,
                    maxX: p.x + width + margin,
                    maxY: p.y + (height / 2) + margin
                };
            }

            if (tryInsert([bbox], entity.id, true)) {
                return p;
            }
        }


        /**
         * @returns {LineLabelPosition}
         */
        function getLineLabel(nodes, id, width, height) {
            var viewport = geoExtent(context.projection.clipExtent()).polygon(),
                length = geoPathLength(nodes);

            if (length < width + 20) return;

            // % along the line to attempt to place the label
            var lineOffsets = [50, 45, 55, 40, 60, 35, 65, 30, 70,
                               25, 75, 20, 80, 15, 95, 10, 90, 5, 95];
            var margin = 3;

            for (var i = 0; i < lineOffsets.length; i++) {
                var offset = lineOffsets[i],
                    middle = offset / 100 * length,
                    start = middle - width / 2;

                if (start < 0 || start + width > length) continue;

                // generate subpath and ignore paths that are invalid or don't cross viewport.
                var sub = subpath(nodes, start, start + width);
                if (!sub || !geoPolygonIntersectsPolygon(viewport, sub, true)) {
                    continue;
                }

                var isReverse = reverse(sub);
                if (isReverse) {
                    sub = sub.reverse();
                }

                var bboxes = [],
                    boxsize = (height + 2) / 2;

                for (var j = 0; j < sub.length - 1; j++) {
                    var a = sub[j];
                    var b = sub[j + 1];
                    var num = Math.max(1, Math.floor(geoEuclideanDistance(a, b) / boxsize / 2));

                    for (var box = 0; box < num; box++) {
                        var p = geoInterp(a, b, box / num);
                        var x0 = p[0] - boxsize - margin;
                        var y0 = p[1] - boxsize - margin;
                        var x1 = p[0] + boxsize + margin;
                        var y1 = p[1] + boxsize + margin;

                        bboxes.push({
                            minX: Math.min(x0, x1),
                            minY: Math.min(y0, y1),
                            maxX: Math.max(x0, x1),
                            maxY: Math.max(y0, y1)
                        });
                    }
                }

                if (tryInsert(bboxes, id, false)) {
                    return {
                        'font-size': height + 2,
                        lineString: lineString(sub),
                        startOffset: offset + '%'
                    };
                }
            }

            function reverse(p) {
                var angle = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
                return !(p[0][0] < p[p.length - 1][0] && angle < Math.PI/2 && angle > -Math.PI/2);
            }

            function lineString(nodes) {
                return 'M' + nodes.join('L');
            }

            function subpath(nodes, from, to) {
                var sofar = 0,
                    start, end, i0, i1;

                for (var i = 0; i < nodes.length - 1; i++) {
                    var a = nodes[i],
                        b = nodes[i + 1];
                    var current = geoEuclideanDistance(a, b);
                    var portion;
                    if (!start && sofar + current >= from) {
                        portion = (from - sofar) / current;
                        start = [
                            a[0] + portion * (b[0] - a[0]),
                            a[1] + portion * (b[1] - a[1])
                        ];
                        i0 = i + 1;
                    }
                    if (!end && sofar + current >= to) {
                        portion = (to - sofar) / current;
                        end = [
                            a[0] + portion * (b[0] - a[0]),
                            a[1] + portion * (b[1] - a[1])
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
        }


        /**
         * @returns {AreaLabelPosition}
         */
        function getAreaLabel(entity, width, height) {
            var centroid = path.centroid(entity.asGeoJSON(graph, true)),
                extent = entity.extent(graph),
                entitywidth = projection(extent[1])[0] - projection(extent[0])[0];

            if (isNaN(centroid[0]) || entitywidth < 20) return;

            var iconSize = 20,
                iconX = centroid[0] - (iconSize / 2),
                iconY = centroid[1] - (iconSize / 2),
                margin = 2,
                textOffset = iconSize + margin,
                p = { transform: 'translate(' + iconX + ',' + iconY + ')' };

            var bbox = {
                minX: iconX,
                minY: iconY,
                maxX: iconX + iconSize,
                maxY: iconY + iconSize
            };

            // try to add icon
            if (tryInsert([bbox], entity.id + 'I', true)) {
                if (width && entitywidth >= width + 20) {
                    var labelX = centroid[0],
                        labelY = centroid[1] + textOffset;

                    bbox = {
                        minX: labelX - (width / 2) - margin,
                        minY: labelY - (height / 2) - margin,
                        maxX: labelX + (width / 2) + margin,
                        maxY: labelY + (height / 2) + margin
                    };

                    // try to add label
                    if (tryInsert([bbox], entity.id, true)) {
                        p.x = labelX;
                        p.y = labelY;
                        p.textAnchor = 'middle';
                        p.height = height;
                    }
                }

                return p;
            }
        }


        function tryInsert(bboxes, id, saveSkipped) {
            var skipped = false,
                bbox;

            for (var i = 0; i < bboxes.length; i++) {
                bbox = bboxes[i];
                bbox.id = id;

                // Check that label is visible
                if (bbox.minX < 0 || bbox.minY < 0 || bbox.maxX > dimensions[0] || bbox.maxY > dimensions[1]) {
                    skipped = true;
                    break;
                }
                if (rdrawn.collides(bbox)) {
                    skipped = true;
                    break;
                }
            }

            entitybboxes[id] = bboxes;

            if (skipped) {
                if (saveSkipped) {
                    rskipped.load(bboxes);
                }
            } else {
                rdrawn.load(bboxes);
            }

            return !skipped;
        }


        var label = selection.selectAll('.layer-label'),
            halo = selection.selectAll('.layer-halo');

        // points
        drawPointLabels(label, labelled.point, filter, 'pointlabel');
        drawPointLabels(halo, labelled.point, filter, 'pointlabel-halo');

        // lines
        drawLinePaths(halo, labelled.line, filter, '');
        drawLineLabels(label, labelled.line, filter, 'linelabel');
        drawLineLabels(halo, labelled.line, filter, 'linelabel-halo');

        // areas
        drawAreaLabels(label, labelled.area, filter, 'arealabel');
        drawAreaLabels(halo, labelled.area, filter, 'arealabel-halo');
        drawAreaIcons(label, labelled.area, filter, 'areaicon');
        drawAreaIcons(halo, labelled.area, filter, 'areaicon-halo');

        // debug
        drawCollisionBoxes(label, rskipped, 'debug-skipped');
        drawCollisionBoxes(label, rdrawn, 'debug-drawn');

        selection.call(filterLabels);
    }


    function filterLabels(selection) {
        var layers = selection
            .selectAll('.layer-label, .layer-halo');

        layers.selectAll('.proximate')
            .classed('proximate', false);

        var mouse = context.mouse(),
            graph = context.graph(),
            selectedIDs = context.selectedIDs(),
            ids = [],
            pad, bbox;

        // hide labels near the mouse
        if (mouse) {
            pad = 20;
            bbox = { minX: mouse[0] - pad, minY: mouse[1] - pad, maxX: mouse[0] + pad, maxY: mouse[1] + pad };
            ids.push.apply(ids, _.map(rdrawn.search(bbox), 'id'));
        }

        // hide labels along selected ways, or near selected vertices
        for (var i = 0; i < selectedIDs.length; i++) {
            var entity = graph.hasEntity(selectedIDs[i]);
            if (!entity) continue;
            var geometry = entity.geometry(graph);

            if (geometry === 'line') {
                ids.push(selectedIDs[i]);
            } else if (geometry === 'vertex') {
                var point = context.projection(entity.loc);
                pad = 10;
                bbox = { minX: point[0] - pad, minY: point[1] - pad, maxX: point[0] + pad, maxY: point[1] + pad };
                ids.push.apply(ids, _.map(rdrawn.search(bbox), 'id'));
            }
        }

        layers.selectAll(utilEntitySelector(ids))
            .classed('proximate', true);
    }


    var throttleFilterLabels = _.throttle(filterLabels, 100);


    drawLabels.observe = function(selection) {
        var listener = function() { throttleFilterLabels(selection); };
        selection.on('mousemove.hidelabels', listener);
        context.on('enter.hidelabels', listener);
    };


    drawLabels.off = function(selection) {
        throttleFilterLabels.cancel();
        selection.on('mousemove.hidelabels', null);
        context.on('enter.hidelabels', null);
    };


    return drawLabels;
}
