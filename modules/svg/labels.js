import _throttle from 'lodash-es/throttle';

import { geoPath as d3_geoPath } from 'd3-geo';
import RBush from 'rbush';
import { localizer } from '../core/localizer';

import {
    geoExtent, geoPolygonIntersectsPolygon, geoPathLength,
    geoScaleToZoom, geoVecInterp, geoVecLength
} from '../geo';
import { presetManager } from '../presets';
import { osmEntity } from '../osm';
import { utilDetect } from '../util/detect';
import { utilDisplayName, utilDisplayNameForPath, utilEntitySelector } from '../util';



export function svgLabels(projection, context) {
    const path = d3_geoPath(projection);
    const detected = utilDetect();
    const baselineHack = (detected.ie ||
        detected.browser.toLowerCase() === 'edge' ||
        (detected.browser.toLowerCase() === 'firefox' && detected.version >= 70));
    const _rdrawn = new RBush();
    const _rskipped = new RBush();
    const _textWidthCache = {};
    let _entitybboxes = {};

    // Listed from highest to lowest priority
    const labelStack = [
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
        ['line', 'ref', '*', 12],
        ['area', 'ref', '*', 12],
        ['point', 'ref', '*', 10],
        ['line', 'name', '*', 12],
        ['area', 'name', '*', 12],
        ['point', 'name', '*', 10]
    ];


    function shouldSkipIcon(preset) {
        const noIcons = ['building', 'landuse', 'natural'];
        return noIcons.some(function(s) {
            return preset.id.indexOf(s) >= 0;
        });
    }


    function get(array, prop) {
        return function(d, i) { return array[i][prop]; };
    }


    function textWidth(text, size, elem) {
        let c = _textWidthCache[size];
        if (!c) c = _textWidthCache[size] = {};

        if (c[text]) {
            return c[text];

        } else if (elem) {
            c[text] = elem.getComputedTextLength();
            return c[text];

        } else {
            const str = encodeURIComponent(text).match(/%[CDEFcdef]/g);
            if (str === null) {
                return size / 3 * 2 * text.length;
            } else {
                return size / 3 * (2 * text.length + str.length);
            }
        }
    }


    function drawLinePaths(selection, entities, filter, classes, labels) {
        const paths = selection.selectAll('path')
            .filter(filter)
            .data(entities, osmEntity.key);

        // exit
        paths.exit()
            .remove();

        // enter/update
        paths.enter()
            .append('path')
            .style('stroke-width', get(labels, 'font-size'))
            .attr('id', function(d) { return 'ideditor-labelpath-' + d.id; })
            .attr('class', classes)
            .merge(paths)
            .attr('d', get(labels, 'lineString'));
    }


    function drawLineLabels(selection, entities, filter, classes, labels) {
        const texts = selection.selectAll('text.' + classes)
            .filter(filter)
            .data(entities, osmEntity.key);

        // exit
        texts.exit()
            .remove();

        // enter
        texts.enter()
            .append('text')
            .attr('class', function(d, i) { return classes + ' ' + labels[i].classes + ' ' + d.id; })
            .attr('dy', baselineHack ? '0.35em' : null)
            .append('textPath')
            .attr('class', 'textpath');

        // update
        selection.selectAll('text.' + classes).selectAll('.textpath')
            .filter(filter)
            .data(entities, osmEntity.key)
            .attr('startOffset', '50%')
            .attr('xlink:href', function(d) { return '#ideditor-labelpath-' + d.id; })
            .text(utilDisplayNameForPath);
    }


    function drawPointLabels(selection, entities, filter, classes, labels) {
        const texts = selection.selectAll('text.' + classes)
            .filter(filter)
            .data(entities, osmEntity.key);

        // exit
        texts.exit()
            .remove();

        // enter/update
        texts.enter()
            .append('text')
            .attr('class', function(d, i) {
                return classes + ' ' + labels[i].classes + ' ' + d.id;
            })
            .merge(texts)
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
        const icons = selection.selectAll('use.' + classes)
            .filter(filter)
            .data(entities, osmEntity.key);

        // exit
        icons.exit()
            .remove();

        // enter/update
        icons.enter()
            .append('use')
            .attr('class', 'icon ' + classes)
            .attr('width', '17px')
            .attr('height', '17px')
            .merge(icons)
            .attr('transform', get(labels, 'transform'))
            .attr('xlink:href', function(d) {
                const preset = presetManager.match(d, context.graph());
                const picon = preset && preset.icon;
                return picon ? '#' + picon : '';
            });
    }


    function drawCollisionBoxes(selection, rtree, which) {
        const classes = 'debug ' + which + ' ' + (which === 'debug-skipped' ? 'orange' : 'yellow');

        let gj = [];
        if (context.getDebug('collision')) {
            gj = rtree.all().map(function(d) {
                return { type: 'Polygon', coordinates: [[
                    [d.minX, d.minY],
                    [d.maxX, d.minY],
                    [d.maxX, d.maxY],
                    [d.minX, d.maxY],
                    [d.minX, d.minY]
                ]]};
            });
        }

        const boxes = selection.selectAll('.' + which)
            .data(gj);

        // exit
        boxes.exit()
            .remove();

        // enter/update
        boxes.enter()
            .append('path')
            .attr('class', classes)
            .merge(boxes)
            .attr('d', d3_geoPath());
    }


    function drawLabels(selection, graph, entities, filter, dimensions, fullRedraw) {
        const wireframe = context.surface().classed('fill-wireframe');
        const zoom = geoScaleToZoom(projection.scale());

        const labelable = [];
        const renderNodeAs = {};
        let i, j, k, entity, geometry;

        for (i = 0; i < labelStack.length; i++) {
            labelable.push([]);
        }

        if (fullRedraw) {
            _rdrawn.clear();
            _rskipped.clear();
            _entitybboxes = {};

        } else {
            for (i = 0; i < entities.length; i++) {
                entity = entities[i];
                const toRemove = []
                    .concat(_entitybboxes[entity.id] || [])
                    .concat(_entitybboxes[entity.id + 'I'] || []);

                for (j = 0; j < toRemove.length; j++) {
                    _rdrawn.remove(toRemove[j]);
                    _rskipped.remove(toRemove[j]);
                }
            }
        }

        // Loop through all the entities to do some preprocessing
        for (i = 0; i < entities.length; i++) {
            entity = entities[i];
            geometry = entity.geometry(graph);

            // Insert collision boxes around interesting points/vertices
            if (geometry === 'point' || (geometry === 'vertex' && isInterestingVertex(entity))) {
                const hasDirections = entity.directions(graph, projection).length;
                let markerPadding;

                if (!wireframe && geometry === 'point' && !(zoom >= 18 && hasDirections)) {
                    renderNodeAs[entity.id] = 'point';
                    markerPadding = 20;   // extra y for marker height
                } else {
                    renderNodeAs[entity.id] = 'vertex';
                    markerPadding = 0;
                }

                const coord = projection(entity.loc);
                const nodePadding = 10;
                const bbox = {
                    minX: coord[0] - nodePadding,
                    minY: coord[1] - nodePadding - markerPadding,
                    maxX: coord[0] + nodePadding,
                    maxY: coord[1] + nodePadding
                };

                doInsert(bbox, entity.id + 'P');
            }

            // From here on, treat vertices like points
            if (geometry === 'vertex') {
                geometry = 'point';
            }

            // Determine which entities are label-able
            const preset = geometry === 'area' && presetManager.match(entity, graph);
            const icon = preset && !shouldSkipIcon(preset) && preset.icon;

            if (!icon && !utilDisplayName(entity)) continue;

            for (k = 0; k < labelStack.length; k++) {
                const matchGeom = labelStack[k][0];
                const matchKey = labelStack[k][1];
                const matchVal = labelStack[k][2];
                const hasVal = entity.tags[matchKey];

                if (geometry === matchGeom && hasVal && (matchVal === '*' || matchVal === hasVal)) {
                    labelable[k].push(entity);
                    break;
                }
            }
        }

        const positions = {
            point: [],
            line: [],
            area: []
        };

        const labelled = {
            point: [],
            line: [],
            area: []
        };

        // Try and find a valid label for labellable entities
        for (k = 0; k < labelable.length; k++) {
            const fontSize = labelStack[k][3];

            for (i = 0; i < labelable[k].length; i++) {
                entity = labelable[k][i];
                geometry = entity.geometry(graph);

                const getName = (geometry === 'line') ? utilDisplayNameForPath : utilDisplayName;
                const name = getName(entity);
                const width = name && textWidth(name, fontSize);
                let p = null;

                if (geometry === 'point' || geometry === 'vertex') {
                    // no point or vertex labels in wireframe mode
                    // no vertex labels at low zooms (vertices have no icons)
                    if (wireframe) continue;
                    const renderAs = renderNodeAs[entity.id];
                    if (renderAs === 'vertex' && zoom < 17) continue;

                    p = getPointLabel(entity, width, fontSize, renderAs);

                } else if (geometry === 'line') {
                    p = getLineLabel(entity, width, fontSize);

                } else if (geometry === 'area') {
                    p = getAreaLabel(entity, width, fontSize);
                }

                if (p) {
                    if (geometry === 'vertex') { geometry = 'point'; }  // treat vertex like point
                    p.classes = geometry + ' tag-' + labelStack[k][1];
                    positions[geometry].push(p);
                    labelled[geometry].push(entity);
                }
            }
        }


        function isInterestingVertex(entity) {
            const selectedIDs = context.selectedIDs();

            return entity.hasInterestingTags() ||
                entity.isEndpoint(graph) ||
                entity.isConnected(graph) ||
                selectedIDs.indexOf(entity.id) !== -1 ||
                graph.parentWays(entity).some(function(parent) {
                    return selectedIDs.indexOf(parent.id) !== -1;
                });
        }


        function getPointLabel(entity, width, height, geometry) {
            const y = (geometry === 'point' ? -12 : 0);
            const pointOffsets = {
                ltr: [15, y, 'start'],
                rtl: [-15, y, 'end']
            };

            const textDirection = localizer.textDirection();

            const coord = projection(entity.loc);
            const textPadding = 2;
            const offset = pointOffsets[textDirection];
            const p = {
                height: height,
                width: width,
                x: coord[0] + offset[0],
                y: coord[1] + offset[1],
                textAnchor: offset[2]
            };

            // insert a collision box for the text label..
            let bbox;
            if (textDirection === 'rtl') {
                bbox = {
                    minX: p.x - width - textPadding,
                    minY: p.y - (height / 2) - textPadding,
                    maxX: p.x + textPadding,
                    maxY: p.y + (height / 2) + textPadding
                };
            } else {
                bbox = {
                    minX: p.x - textPadding,
                    minY: p.y - (height / 2) - textPadding,
                    maxX: p.x + width + textPadding,
                    maxY: p.y + (height / 2) + textPadding
                };
            }

            if (tryInsert([bbox], entity.id, true)) {
                return p;
            }
        }


        function getLineLabel(entity, width, height) {
            const viewport = geoExtent(context.projection.clipExtent()).polygon();
            const points = graph.childNodes(entity)
                .map(function(node) { return projection(node.loc); });
            const length = geoPathLength(points);

            if (length < width + 20) return;

            // % along the line to attempt to place the label
            const lineOffsets = [50, 45, 55, 40, 60, 35, 65, 30, 70,
                               25, 75, 20, 80, 15, 95, 10, 90, 5, 95];
            const padding = 3;

            for (let i = 0; i < lineOffsets.length; i++) {
                const offset = lineOffsets[i];
                const middle = offset / 100 * length;
                const start = middle - width / 2;

                if (start < 0 || start + width > length) continue;

                // generate subpath and ignore paths that are invalid or don't cross viewport.
                let sub = subpath(points, start, start + width);
                if (!sub || !geoPolygonIntersectsPolygon(viewport, sub, true)) {
                    continue;
                }

                const isReverse = reverse(sub);
                if (isReverse) {
                    sub = sub.reverse();
                }

                const bboxes = [];
                const boxsize = (height + 2) / 2;

                for (let j = 0; j < sub.length - 1; j++) {
                    const a = sub[j];
                    const b = sub[j + 1];

                    // split up the text into small collision boxes
                    const num = Math.max(1, Math.floor(geoVecLength(a, b) / boxsize / 2));

                    for (let box = 0; box < num; box++) {
                        const p = geoVecInterp(a, b, box / num);
                        const x0 = p[0] - boxsize - padding;
                        const y0 = p[1] - boxsize - padding;
                        const x1 = p[0] + boxsize + padding;
                        const y1 = p[1] + boxsize + padding;

                        bboxes.push({
                            minX: Math.min(x0, x1),
                            minY: Math.min(y0, y1),
                            maxX: Math.max(x0, x1),
                            maxY: Math.max(y0, y1)
                        });
                    }
                }

                if (tryInsert(bboxes, entity.id, false)) {   // accept this one
                    return {
                        'font-size': height + 2,
                        lineString: lineString(sub),
                        startOffset: offset + '%'
                    };
                }
            }

            function reverse(p) {
                const angle = Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
                return !(p[0][0] < p[p.length - 1][0] && angle < Math.PI/2 && angle > -Math.PI/2);
            }

            function lineString(points) {
                return 'M' + points.join('L');
            }

            function subpath(points, from, to) {
                let sofar = 0;
                let start, end, i0, i1;

                for (let i = 0; i < points.length - 1; i++) {
                    const a = points[i];
                    const b = points[i + 1];
                    const current = geoVecLength(a, b);
                    let portion;
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

                const result = points.slice(i0, i1);
                result.unshift(start);
                result.push(end);
                return result;
            }
        }


        function getAreaLabel(entity, width, height) {
            const centroid = path.centroid(entity.asGeoJSON(graph));
            const extent = entity.extent(graph);
            const areaWidth = projection(extent[1])[0] - projection(extent[0])[0];

            if (isNaN(centroid[0]) || areaWidth < 20) return;

            const preset = presetManager.match(entity, context.graph());
            const picon = preset && preset.icon;
            const iconSize = 17;
            const padding = 2;
            const p = {};

            if (picon) {  // icon and label..
                if (addIcon()) {
                    addLabel(iconSize + padding);
                    return p;
                }
            } else {   // label only..
                if (addLabel(0)) {
                    return p;
                }
            }


            function addIcon() {
                const iconX = centroid[0] - (iconSize / 2);
                const iconY = centroid[1] - (iconSize / 2);
                const bbox = {
                    minX: iconX,
                    minY: iconY,
                    maxX: iconX + iconSize,
                    maxY: iconY + iconSize
                };

                if (tryInsert([bbox], entity.id + 'I', true)) {
                    p.transform = 'translate(' + iconX + ',' + iconY + ')';
                    return true;
                }
                return false;
            }

            function addLabel(yOffset) {
                if (width && areaWidth >= width + 20) {
                    const labelX = centroid[0];
                    const labelY = centroid[1] + yOffset;
                    const bbox = {
                        minX: labelX - (width / 2) - padding,
                        minY: labelY - (height / 2) - padding,
                        maxX: labelX + (width / 2) + padding,
                        maxY: labelY + (height / 2) + padding
                    };

                    if (tryInsert([bbox], entity.id, true)) {
                        p.x = labelX;
                        p.y = labelY;
                        p.textAnchor = 'middle';
                        p.height = height;
                        return true;
                    }
                }
                return false;
            }
        }


        // force insert a singular bounding box
        // singular box only, no array, id better be unique
        function doInsert(bbox, id) {
            bbox.id = id;

            const oldbox = _entitybboxes[id];
            if (oldbox) {
                _rdrawn.remove(oldbox);
            }
            _entitybboxes[id] = bbox;
            _rdrawn.insert(bbox);
        }


        function tryInsert(bboxes, id, saveSkipped) {
            let skipped = false;

            for (let i = 0; i < bboxes.length; i++) {
                const bbox = bboxes[i];
                bbox.id = id;

                // Check that label is visible
                if (bbox.minX < 0 || bbox.minY < 0 || bbox.maxX > dimensions[0] || bbox.maxY > dimensions[1]) {
                    skipped = true;
                    break;
                }
                if (_rdrawn.collides(bbox)) {
                    skipped = true;
                    break;
                }
            }

            _entitybboxes[id] = bboxes;

            if (skipped) {
                if (saveSkipped) {
                    _rskipped.load(bboxes);
                }
            } else {
                _rdrawn.load(bboxes);
            }

            return !skipped;
        }


        const layer = selection.selectAll('.layer-osm.labels');
        layer.selectAll('.labels-group')
            .data(['halo', 'label', 'debug'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'labels-group ' + d; });

        const halo = layer.selectAll('.labels-group.halo');
        const label = layer.selectAll('.labels-group.label');
        const debug = layer.selectAll('.labels-group.debug');

        // points
        drawPointLabels(label, labelled.point, filter, 'pointlabel', positions.point);
        drawPointLabels(halo, labelled.point, filter, 'pointlabel-halo', positions.point);

        // lines
        drawLinePaths(layer, labelled.line, filter, '', positions.line);
        drawLineLabels(label, labelled.line, filter, 'linelabel', positions.line);
        drawLineLabels(halo, labelled.line, filter, 'linelabel-halo', positions.line);

        // areas
        drawAreaLabels(label, labelled.area, filter, 'arealabel', positions.area);
        drawAreaLabels(halo, labelled.area, filter, 'arealabel-halo', positions.area);
        drawAreaIcons(label, labelled.area, filter, 'areaicon', positions.area);
        drawAreaIcons(halo, labelled.area, filter, 'areaicon-halo', positions.area);

        // debug
        drawCollisionBoxes(debug, _rskipped, 'debug-skipped');
        drawCollisionBoxes(debug, _rdrawn, 'debug-drawn');

        layer.call(filterLabels);
    }


    function filterLabels(selection) {
        const drawLayer = selection.selectAll('.layer-osm.labels');
        const layers = drawLayer.selectAll('.labels-group.halo, .labels-group.label');

        layers.selectAll('.nolabel')
            .classed('nolabel', false);

        const mouse = context.map().mouse();
        const graph = context.graph();
        const selectedIDs = context.selectedIDs();
        const ids = [];
        let pad, bbox;

        // hide labels near the mouse
        if (mouse) {
            pad = 20;
            bbox = { minX: mouse[0] - pad, minY: mouse[1] - pad, maxX: mouse[0] + pad, maxY: mouse[1] + pad };
            const nearMouse = _rdrawn.search(bbox).map(function(entity) { return entity.id; });
            ids.push.apply(ids, nearMouse);
        }

        // hide labels on selected nodes (they look weird when dragging / haloed)
        for (let i = 0; i < selectedIDs.length; i++) {
            const entity = graph.hasEntity(selectedIDs[i]);
            if (entity && entity.type === 'node') {
                ids.push(selectedIDs[i]);
            }
        }

        layers.selectAll(utilEntitySelector(ids))
            .classed('nolabel', true);


        // draw the mouse bbox if debugging is on..
        const debug = selection.selectAll('.labels-group.debug');
        let gj = [];
        if (context.getDebug('collision')) {
            gj = bbox ? [{
                type: 'Polygon',
                coordinates: [[
                    [bbox.minX, bbox.minY],
                    [bbox.maxX, bbox.minY],
                    [bbox.maxX, bbox.maxY],
                    [bbox.minX, bbox.maxY],
                    [bbox.minX, bbox.minY]
                ]]
            }] : [];
        }

        const box = debug.selectAll('.debug-mouse')
            .data(gj);

        // exit
        box.exit()
            .remove();

        // enter/update
        box.enter()
            .append('path')
            .attr('class', 'debug debug-mouse yellow')
            .merge(box)
            .attr('d', d3_geoPath());
    }


    const throttleFilterLabels = _throttle(filterLabels, 100);


    drawLabels.observe = function(selection) {
        const listener = function() { throttleFilterLabels(selection); };
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
