(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.svg = global.iD.svg || {})));
}(this, function (exports) { 'use strict';

    function Areas(projection) {
        // Patterns only work in Firefox when set directly on element.
        // (This is not a bug: https://bugzilla.mozilla.org/show_bug.cgi?id=750632)
        var patterns = {
            wetland: 'wetland',
            beach: 'beach',
            scrub: 'scrub',
            construction: 'construction',
            military: 'construction',
            cemetery: 'cemetery',
            grave_yard: 'cemetery',
            meadow: 'meadow',
            farm: 'farmland',
            farmland: 'farmland',
            orchard: 'orchard'
        };

        var patternKeys = ['landuse', 'natural', 'amenity'];

        function setPattern(d) {
            for (var i = 0; i < patternKeys.length; i++) {
                if (patterns.hasOwnProperty(d.tags[patternKeys[i]])) {
                    this.style.fill = this.style.stroke = 'url("#pattern-' + patterns[d.tags[patternKeys[i]]] + '")';
                    return;
                }
            }
            this.style.fill = this.style.stroke = '';
        }

        return function drawAreas(surface, graph, entities, filter) {
            var path = iD.svg.Path(projection, graph, true),
                areas = {},
                multipolygon;

            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (entity.geometry(graph) !== 'area') continue;

                multipolygon = iD.geo.isSimpleMultipolygonOuterMember(entity, graph);
                if (multipolygon) {
                    areas[multipolygon.id] = {
                        entity: multipolygon.mergeTags(entity.tags),
                        area: Math.abs(entity.area(graph))
                    };
                } else if (!areas[entity.id]) {
                    areas[entity.id] = {
                        entity: entity,
                        area: Math.abs(entity.area(graph))
                    };
                }
            }

            areas = d3.values(areas).filter(function hasPath(a) { return path(a.entity); });
            areas.sort(function areaSort(a, b) { return b.area - a.area; });
            areas = _.map(areas, 'entity');

            var strokes = areas.filter(function(area) {
                return area.type === 'way';
            });

            var data = {
                clip: areas,
                shadow: strokes,
                stroke: strokes,
                fill: areas
            };

            var clipPaths = surface.selectAll('defs').selectAll('.clipPath')
               .filter(filter)
               .data(data.clip, iD.Entity.key);

            clipPaths.enter()
               .append('clipPath')
               .attr('class', 'clipPath')
               .attr('id', function(entity) { return entity.id + '-clippath'; })
               .append('path');

            clipPaths.selectAll('path')
               .attr('d', path);

            clipPaths.exit()
               .remove();

            var areagroup = surface
                .selectAll('.layer-areas')
                .selectAll('g.areagroup')
                .data(['fill', 'shadow', 'stroke']);

            areagroup.enter()
                .append('g')
                .attr('class', function(d) { return 'layer areagroup area-' + d; });

            var paths = areagroup
                .selectAll('path')
                .filter(filter)
                .data(function(layer) { return data[layer]; }, iD.Entity.key);

            // Remove exiting areas first, so they aren't included in the `fills`
            // array used for sorting below (https://github.com/openstreetmap/iD/issues/1903).
            paths.exit()
                .remove();

            var fills = surface.selectAll('.area-fill path.area')[0];

            var bisect = d3.bisector(function(node) {
                return -node.__data__.area(graph);
            }).left;

            function sortedByArea(entity) {
                if (this.__data__ === 'fill') {
                    return fills[bisect(fills, -entity.area(graph))];
                }
            }

            paths.enter()
                .insert('path', sortedByArea)
                .each(function(entity) {
                    var layer = this.parentNode.__data__;

                    this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                    if (layer === 'fill') {
                        this.setAttribute('clip-path', 'url(#' + entity.id + '-clippath)');
                        setPattern.apply(this, arguments);
                    }
                })
                .call(iD.svg.TagClasses());

            paths
                .attr('d', path);
        };
    }

    function Debug(projection, context) {

        function multipolygons(imagery) {
            return imagery.map(function(data) {
                return {
                    type: 'MultiPolygon',
                    coordinates: [ data.polygon ]
                };
            });
        }

        function drawDebug(surface) {
            var showsTile = context.getDebug('tile'),
                showsCollision = context.getDebug('collision'),
                showsImagery = context.getDebug('imagery'),
                showsImperial = context.getDebug('imperial'),
                showsDriveLeft = context.getDebug('driveLeft'),
                path = d3.geo.path().projection(projection);


            var debugData = [];
            if (showsTile) {
                debugData.push({ class: 'red', label: 'tile' });
            }
            if (showsCollision) {
                debugData.push({ class: 'yellow', label: 'collision' });
            }
            if (showsImagery) {
                debugData.push({ class: 'orange', label: 'imagery' });
            }
            if (showsImperial) {
                debugData.push({ class: 'cyan', label: 'imperial' });
            }
            if (showsDriveLeft) {
                debugData.push({ class: 'green', label: 'driveLeft' });
            }


            var legend = d3.select('#content')
                .selectAll('.debug-legend')
                .data(debugData.length ? [0] : []);

            legend.enter()
                .append('div')
                .attr('class', 'fillD debug-legend');

            legend.exit()
                .remove();


            var legendItems = legend.selectAll('.debug-legend-item')
                .data(debugData, function(d) { return d.label; });

            legendItems.enter()
                .append('span')
                .attr('class', function(d) { return 'debug-legend-item ' + d.class; })
                .text(function(d) { return d.label; });

            legendItems.exit()
                .remove();


            var layer = surface.selectAll('.layer-debug')
                .data(showsImagery || showsImperial || showsDriveLeft ? [0] : []);

            layer.enter()
                .append('g')
                .attr('class', 'layer-debug');

            layer.exit()
                .remove();


            var extent = context.map().extent(),
                availableImagery = showsImagery && multipolygons(iD.data.imagery.filter(function(source) {
                    if (!source.polygon) return false;
                    return source.polygon.some(function(polygon) {
                        return iD.geo.polygonIntersectsPolygon(polygon, extent, true);
                    });
                }));

            var imagery = layer.selectAll('path.debug-imagery')
                .data(showsImagery ? availableImagery : []);

            imagery.enter()
                .append('path')
                .attr('class', 'debug-imagery debug orange');

            imagery.exit()
                .remove();


            var imperial = layer
                .selectAll('path.debug-imperial')
                .data(showsImperial ? [iD.data.imperial] : []);

            imperial.enter()
                .append('path')
                .attr('class', 'debug-imperial debug cyan');

            imperial.exit()
                .remove();


            var driveLeft = layer
                .selectAll('path.debug-drive-left')
                .data(showsDriveLeft ? [iD.data.driveLeft] : []);

            driveLeft.enter()
                .append('path')
                .attr('class', 'debug-drive-left debug green');

            driveLeft.exit()
                .remove();


            // update
            layer.selectAll('path')
                .attr('d', path);
        }

        // This looks strange because `enabled` methods on other layers are
        // chainable getter/setters, and this one is just a getter.
        drawDebug.enabled = function() {
            if (!arguments.length) {
                return context.getDebug('tile') ||
                    context.getDebug('collision') ||
                    context.getDebug('imagery') ||
                    context.getDebug('imperial') ||
                    context.getDebug('driveLeft');
            } else {
                return this;
            }
        };

        return drawDebug;
    }

    /*
        A standalone SVG element that contains only a `defs` sub-element. To be
        used once globally, since defs IDs must be unique within a document.
    */
    function Defs(context) {

        function SVGSpriteDefinition(id, href) {
            return function(defs) {
                d3.xml(href, 'image/svg+xml', function(err, svg) {
                    if (err) return;
                    defs.node().appendChild(
                        d3.select(svg.documentElement).attr('id', id).node()
                    );
                });
            };
        }

        return function drawDefs(selection) {
            var defs = selection.append('defs');

            // marker
            defs.append('marker')
                .attr({
                    id: 'oneway-marker',
                    viewBox: '0 0 10 10',
                    refY: 2.5,
                    refX: 5,
                    markerWidth: 2,
                    markerHeight: 2,
                    markerUnits: 'strokeWidth',
                    orient: 'auto'
                })
                .append('path')
                .attr('class', 'oneway')
                .attr('d', 'M 5 3 L 0 3 L 0 2 L 5 2 L 5 0 L 10 2.5 L 5 5 z')
                .attr('stroke', 'none')
                .attr('fill', '#000')
                .attr('opacity', '0.5');

            // patterns
            var patterns = defs.selectAll('pattern')
                .data([
                    // pattern name, pattern image name
                    ['wetland', 'wetland'],
                    ['construction', 'construction'],
                    ['cemetery', 'cemetery'],
                    ['orchard', 'orchard'],
                    ['farmland', 'farmland'],
                    ['beach', 'dots'],
                    ['scrub', 'dots'],
                    ['meadow', 'dots']
                ])
                .enter()
                .append('pattern')
                .attr({
                    id: function (d) {
                        return 'pattern-' + d[0];
                    },
                    width: 32,
                    height: 32,
                    patternUnits: 'userSpaceOnUse'
                });

            patterns.append('rect')
                .attr({
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32,
                    'class': function (d) {
                        return 'pattern-color-' + d[0];
                    }
                });

            patterns.append('image')
                .attr({
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                })
                .attr('xlink:href', function (d) {
                    return context.imagePath('pattern/' + d[1] + '.png');
                });

            // clip paths
            defs.selectAll()
                .data([12, 18, 20, 32, 45])
                .enter().append('clipPath')
                .attr('id', function (d) {
                    return 'clip-square-' + d;
                })
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', function (d) {
                    return d;
                })
                .attr('height', function (d) {
                    return d;
                });

            defs.call(SVGSpriteDefinition(
                'iD-sprite',
                context.imagePath('iD-sprite.svg')));

            defs.call(SVGSpriteDefinition(
                'maki-sprite',
                context.imagePath('maki-sprite.svg')));
        };
    }

    function Gpx(projection, context, dispatch) {
        var showLabels = true,
            layer;

        function init() {
            if (iD.svg.Gpx.initialized) return;  // run once

            iD.svg.Gpx.geojson = {};
            iD.svg.Gpx.enabled = true;

            function over() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                d3.event.dataTransfer.dropEffect = 'copy';
            }

            d3.select('body')
                .attr('dropzone', 'copy')
                .on('drop.localgpx', function() {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    if (!iD.detect().filedrop) return;
                    drawGpx.files(d3.event.dataTransfer.files);
                })
                .on('dragenter.localgpx', over)
                .on('dragexit.localgpx', over)
                .on('dragover.localgpx', over);

            iD.svg.Gpx.initialized = true;
        }


        function drawGpx(surface) {
            var geojson = iD.svg.Gpx.geojson,
                enabled = iD.svg.Gpx.enabled;

            layer = surface.selectAll('.layer-gpx')
                .data(enabled ? [0] : []);

            layer.enter()
                .append('g')
                .attr('class', 'layer-gpx');

            layer.exit()
                .remove();


            var paths = layer
                .selectAll('path')
                .data([geojson]);

            paths.enter()
                .append('path')
                .attr('class', 'gpx');

            paths.exit()
                .remove();

            var path = d3.geo.path()
                .projection(projection);

            paths
                .attr('d', path);


            var labels = layer.selectAll('text')
                .data(showLabels && geojson.features ? geojson.features : []);

            labels.enter()
                .append('text')
                .attr('class', 'gpx');

            labels.exit()
                .remove();

            labels
                .text(function(d) {
                    return d.properties.desc || d.properties.name;
                })
                .attr('x', function(d) {
                    var centroid = path.centroid(d);
                    return centroid[0] + 7;
                })
                .attr('y', function(d) {
                    var centroid = path.centroid(d);
                    return centroid[1];
                });

        }

        function toDom(x) {
            return (new DOMParser()).parseFromString(x, 'text/xml');
        }

        drawGpx.showLabels = function(_) {
            if (!arguments.length) return showLabels;
            showLabels = _;
            return this;
        };

        drawGpx.enabled = function(_) {
            if (!arguments.length) return iD.svg.Gpx.enabled;
            iD.svg.Gpx.enabled = _;
            dispatch.change();
            return this;
        };

        drawGpx.hasGpx = function() {
            var geojson = iD.svg.Gpx.geojson;
            return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
        };

        drawGpx.geojson = function(gj) {
            if (!arguments.length) return iD.svg.Gpx.geojson;
            if (_.isEmpty(gj) || _.isEmpty(gj.features)) return this;
            iD.svg.Gpx.geojson = gj;
            dispatch.change();
            return this;
        };

        drawGpx.url = function(url) {
            d3.text(url, function(err, data) {
                if (!err) {
                    drawGpx.geojson(toGeoJSON.gpx(toDom(data)));
                }
            });
            return this;
        };

        drawGpx.files = function(fileList) {
            if (!fileList.length) return this;
            var f = fileList[0],
                reader = new FileReader();

            reader.onload = function(e) {
                drawGpx.geojson(toGeoJSON.gpx(toDom(e.target.result))).fitZoom();
            };

            reader.readAsText(f);
            return this;
        };

        drawGpx.fitZoom = function() {
            if (!this.hasGpx()) return this;
            var geojson = iD.svg.Gpx.geojson;

            var map = context.map(),
                viewport = map.trimmedExtent().polygon(),
                coords = _.reduce(geojson.features, function(coords, feature) {
                    var c = feature.geometry.coordinates;
                    return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
                }, []);

            if (!iD.geo.polygonIntersectsPolygon(viewport, coords, true)) {
                var extent = iD.geo.Extent(d3.geo.bounds(geojson));
                map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
            }

            return this;
        };

        init();
        return drawGpx;
    }

    function Icon(name, svgklass, useklass) {
        return function drawIcon(selection) {
            selection.selectAll('svg')
                .data([0])
                .enter()
                .append('svg')
                .attr('class', 'icon ' + (svgklass || ''))
                .append('use')
                .attr('xlink:href', name)
                .attr('class', useklass);
        };
    }

    function Labels(projection, context) {
        var path = d3.geo.path().projection(projection);

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
            var style = iD.util.getStyle('text.' + d[0] + '.tag-' + d[1]),
                m = style && style.cssText.match('font-size: ([0-9]{1,2})px;');
            if (m) return parseInt(m[1], 10);

            style = iD.util.getStyle('text.' + d[0]);
            m = style && style.cssText.match('font-size: ([0-9]{1,2})px;');
            if (m) return parseInt(m[1], 10);

            return default_size;
        });

        var iconSize = 18;

        var pointOffsets = [
            [15, -11, 'start'], // right
            [10, -11, 'start'], // unused right now
            [-15, -11, 'end']
        ];

        var lineOffsets = [50, 45, 55, 40, 60, 35, 65, 30, 70, 25,
            75, 20, 80, 15, 95, 10, 90, 5, 95];


        var noIcons = ['building', 'landuse', 'natural'];
        function blacklisted(preset) {
            return _.some(noIcons, function(s) {
                return preset.id.indexOf(s) >= 0;
            });
        }

        function get(array, prop) {
            return function(d, i) { return array[i][prop]; };
        }

        var textWidthCache = {};

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

        function drawLineLabels(group, entities, filter, classes, labels) {
            var texts = group.selectAll('text.' + classes)
                .filter(filter)
                .data(entities, iD.Entity.key);

            texts.enter()
                .append('text')
                .attr('class', function(d, i) { return classes + ' ' + labels[i].classes + ' ' + d.id; })
                .append('textPath')
                .attr('class', 'textpath');


            texts.selectAll('.textpath')
                .filter(filter)
                .data(entities, iD.Entity.key)
                .attr({
                    'startOffset': '50%',
                    'xlink:href': function(d) { return '#labelpath-' + d.id; }
                })
                .text(iD.util.displayName);

            texts.exit().remove();
        }

        function drawLinePaths(group, entities, filter, classes, labels) {
            var halos = group.selectAll('path')
                .filter(filter)
                .data(entities, iD.Entity.key);

            halos.enter()
                .append('path')
                .style('stroke-width', get(labels, 'font-size'))
                .attr('id', function(d) { return 'labelpath-' + d.id; })
                .attr('class', classes);

            halos.attr('d', get(labels, 'lineString'));

            halos.exit().remove();
        }

        function drawPointLabels(group, entities, filter, classes, labels) {
            var texts = group.selectAll('text.' + classes)
                .filter(filter)
                .data(entities, iD.Entity.key);

            texts.enter()
                .append('text')
                .attr('class', function(d, i) { return classes + ' ' + labels[i].classes + ' ' + d.id; });

            texts.attr('x', get(labels, 'x'))
                .attr('y', get(labels, 'y'))
                .style('text-anchor', get(labels, 'textAnchor'))
                .text(iD.util.displayName)
                .each(function(d, i) { textWidth(iD.util.displayName(d), labels[i].height, this); });

            texts.exit().remove();
            return texts;
        }

        function drawAreaLabels(group, entities, filter, classes, labels) {
            entities = entities.filter(hasText);
            labels = labels.filter(hasText);
            return drawPointLabels(group, entities, filter, classes, labels);

            function hasText(d, i) {
                return labels[i].hasOwnProperty('x') && labels[i].hasOwnProperty('y');
            }
        }

        function drawAreaIcons(group, entities, filter, classes, labels) {
            var icons = group.selectAll('use')
                .filter(filter)
                .data(entities, iD.Entity.key);

            icons.enter()
                .append('use')
                .attr('class', 'icon areaicon')
                .attr('width', '18px')
                .attr('height', '18px');

            icons.attr('transform', get(labels, 'transform'))
                .attr('xlink:href', function(d) {
                    var icon = context.presets().match(d, context.graph()).icon;
                    return '#' + icon + (icon === 'hairdresser' ? '-24': '-18');    // workaround: maki hairdresser-18 broken?
                });


            icons.exit().remove();
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

        function hideOnMouseover() {
            var layers = d3.select(this)
                .selectAll('.layer-label, .layer-halo');

            layers.selectAll('.proximate')
                .classed('proximate', false);

            var mouse = context.mouse(),
                pad = 50,
                rect = [mouse[0] - pad, mouse[1] - pad, mouse[0] + pad, mouse[1] + pad],
                ids = _.map(rtree.search(rect), 'id');

            if (!ids.length) return;
            layers.selectAll('.' + ids.join(', .'))
                .classed('proximate', true);
        }

        var rtree = rbush(),
            rectangles = {};

        function drawLabels(surface, graph, entities, filter, dimensions, fullRedraw) {
            var hidePoints = !surface.selectAll('.node.point').node();

            var labelable = [], i, k, entity;
            for (i = 0; i < label_stack.length; i++) labelable.push([]);

            if (fullRedraw) {
                rtree.clear();
                rectangles = {};
            } else {
                for (i = 0; i < entities.length; i++) {
                    rtree.remove(rectangles[entities[i].id]);
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

                if (!icon && !iD.util.displayName(entity))
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
                var font_size = font_sizes[k];
                for (i = 0; i < labelable[k].length; i++) {
                    entity = labelable[k][i];
                    var name = iD.util.displayName(entity),
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
                var rect = [p.x - m, p.y - m, p.x + width + m, p.y + height + m];
                if (tryInsert(rect, entity.id)) return p;
            }


            function getLineLabel(entity, width, height) {
                var nodes = _.map(graph.childNodes(entity), 'loc').map(projection),
                    length = iD.geo.pathLength(nodes);
                if (length < width + 20) return;

                for (var i = 0; i < lineOffsets.length; i++) {
                    var offset = lineOffsets[i],
                        middle = offset / 100 * length,
                        start = middle - width/2;
                    if (start < 0 || start + width > length) continue;
                    var sub = subpath(nodes, start, start + width),
                        rev = reverse(sub),
                        rect = [
                            Math.min(sub[0][0], sub[sub.length - 1][0]) - 10,
                            Math.min(sub[0][1], sub[sub.length - 1][1]) - 10,
                            Math.max(sub[0][0], sub[sub.length - 1][0]) + 20,
                            Math.max(sub[0][1], sub[sub.length - 1][1]) + 30
                        ];
                    if (rev) sub = sub.reverse();
                    if (tryInsert(rect, entity.id)) return {
                        'font-size': height + 2,
                        lineString: lineString(sub),
                        startOffset: offset + '%'
                    };
                }
            }

            function getAreaLabel(entity, width, height) {
                var centroid = path.centroid(entity.asGeoJSON(graph, true)),
                    extent = entity.extent(graph),
                    entitywidth = projection(extent[1])[0] - projection(extent[0])[0],
                    rect;

                if (isNaN(centroid[0]) || entitywidth < 20) return;

                var iconX = centroid[0] - (iconSize/2),
                    iconY = centroid[1] - (iconSize/2),
                    textOffset = iconSize + 5;

                var p = {
                    transform: 'translate(' + iconX + ',' + iconY + ')'
                };

                if (width && entitywidth >= width + 20) {
                    p.x = centroid[0];
                    p.y = centroid[1] + textOffset;
                    p.textAnchor = 'middle';
                    p.height = height;
                    rect = [p.x - width/2, p.y, p.x + width/2, p.y + height + textOffset];
                } else {
                    rect = [iconX, iconY, iconX + iconSize, iconY + iconSize];
                }

                if (tryInsert(rect, entity.id)) return p;

            }

            function tryInsert(rect, id) {
                // Check that label is visible
                if (rect[0] < 0 || rect[1] < 0 || rect[2] > dimensions[0] ||
                    rect[3] > dimensions[1]) return false;
                var v = rtree.search(rect).length === 0;
                if (v) {
                    rect.id = id;
                    rtree.insert(rect);
                    rectangles[id] = rect;
                }
                return v;
            }

            var label = surface.selectAll('.layer-label'),
                halo = surface.selectAll('.layer-halo');

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
            var showDebug = context.getDebug('collision');
            var debug = label.selectAll('.layer-label-debug')
                .data(showDebug ? [true] : []);

            debug.enter()
                .append('g')
                .attr('class', 'layer-label-debug');

            debug.exit()
                .remove();

            if (showDebug) {
                var gj = rtree.all().map(function(d) {
                    return { type: 'Polygon', coordinates: [[
                        [d[0], d[1]],
                        [d[2], d[1]],
                        [d[2], d[3]],
                        [d[0], d[3]],
                        [d[0], d[1]]
                    ]]};
                });

                var debugboxes = debug.selectAll('.debug').data(gj);

                debugboxes.enter()
                    .append('path')
                    .attr('class', 'debug yellow');

                debugboxes.exit()
                    .remove();

                debugboxes
                    .attr('d', d3.geo.path().projection(null));
            }
        }

        drawLabels.supersurface = function(supersurface) {
            supersurface
                .on('mousemove.hidelabels', hideOnMouseover)
                .on('mousedown.hidelabels', function () {
                    supersurface.on('mousemove.hidelabels', null);
                })
                .on('mouseup.hidelabels', function () {
                    supersurface.on('mousemove.hidelabels', hideOnMouseover);
                });
        };

        return drawLabels;
    }

    function Layers(projection, context) {
        var dispatch = d3.dispatch('change'),
            svg = d3.select(null),
            layers = [
                { id: 'osm', layer: iD.svg.Osm(projection, context, dispatch) },
                { id: 'gpx', layer: iD.svg.Gpx(projection, context, dispatch) },
                { id: 'mapillary-images', layer: iD.svg.MapillaryImages(projection, context, dispatch) },
                { id: 'mapillary-signs',  layer: iD.svg.MapillarySigns(projection, context, dispatch) },
                { id: 'debug', layer: iD.svg.Debug(projection, context, dispatch) }
            ];


        function drawLayers(selection) {
            svg = selection.selectAll('.surface')
                .data([0]);

            svg.enter()
                .append('svg')
                .attr('class', 'surface')
                .append('defs');

            var groups = svg.selectAll('.data-layer')
                .data(layers);

            groups.enter()
                .append('g')
                .attr('class', function(d) { return 'data-layer data-layer-' + d.id; });

            groups
                .each(function(d) { d3.select(this).call(d.layer); });

            groups.exit()
                .remove();
        }

        drawLayers.all = function() {
            return layers;
        };

        drawLayers.layer = function(id) {
            var obj = _.find(layers, function(o) {return o.id === id;});
            return obj && obj.layer;
        };

        drawLayers.only = function(what) {
            var arr = [].concat(what);
            drawLayers.remove(_.difference(_.map(layers, 'id'), arr));
            return this;
        };

        drawLayers.remove = function(what) {
            var arr = [].concat(what);
            arr.forEach(function(id) {
                layers = _.reject(layers, function(o) {return o.id === id;});
            });
            dispatch.change();
            return this;
        };

        drawLayers.add = function(what) {
            var arr = [].concat(what);
            arr.forEach(function(obj) {
                if ('id' in obj && 'layer' in obj) {
                    layers.push(obj);
                }
            });
            dispatch.change();
            return this;
        };

        drawLayers.dimensions = function(_) {
            if (!arguments.length) return svg.dimensions();
            svg.dimensions(_);
            layers.forEach(function(obj) {
                if (obj.layer.dimensions) {
                    obj.layer.dimensions(_);
                }
            });
            return this;
        };


        return d3.rebind(drawLayers, dispatch, 'on');
    }

    function Lines(projection) {

        var highway_stack = {
            motorway: 0,
            motorway_link: 1,
            trunk: 2,
            trunk_link: 3,
            primary: 4,
            primary_link: 5,
            secondary: 6,
            tertiary: 7,
            unclassified: 8,
            residential: 9,
            service: 10,
            footway: 11
        };

        function waystack(a, b) {
            var as = 0, bs = 0;

            if (a.tags.highway) { as -= highway_stack[a.tags.highway]; }
            if (b.tags.highway) { bs -= highway_stack[b.tags.highway]; }
            return as - bs;
        }

        return function drawLines(surface, graph, entities, filter) {
            var ways = [], pathdata = {}, onewaydata = {},
                getPath = iD.svg.Path(projection, graph);

            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i],
                    outer = iD.geo.simpleMultipolygonOuterMember(entity, graph);
                if (outer) {
                    ways.push(entity.mergeTags(outer.tags));
                } else if (entity.geometry(graph) === 'line') {
                    ways.push(entity);
                }
            }

            ways = ways.filter(getPath);

            pathdata = _.groupBy(ways, function(way) { return way.layer(); });

            _.forOwn(pathdata, function(v, k) {
                onewaydata[k] = _(v)
                    .filter(function(d) { return d.isOneWay(); })
                    .map(iD.svg.OneWaySegments(projection, graph, 35))
                    .flatten()
                    .valueOf();
            });

            var layergroup = surface
                .selectAll('.layer-lines')
                .selectAll('g.layergroup')
                .data(d3.range(-10, 11));

            layergroup.enter()
                .append('g')
                .attr('class', function(d) { return 'layer layergroup layer' + String(d); });


            var linegroup = layergroup
                .selectAll('g.linegroup')
                .data(['shadow', 'casing', 'stroke']);

            linegroup.enter()
                .append('g')
                .attr('class', function(d) { return 'layer linegroup line-' + d; });


            var lines = linegroup
                .selectAll('path')
                .filter(filter)
                .data(
                    function() { return pathdata[this.parentNode.parentNode.__data__] || []; },
                    iD.Entity.key
                );

            // Optimization: call simple TagClasses only on enter selection. This
            // works because iD.Entity.key is defined to include the entity v attribute.
            lines.enter()
                .append('path')
                .attr('class', function(d) { return 'way line ' + this.parentNode.__data__ + ' ' + d.id; })
                .call(iD.svg.TagClasses());

            lines
                .sort(waystack)
                .attr('d', getPath)
                .call(iD.svg.TagClasses().tags(iD.svg.RelationMemberTags(graph)));

            lines.exit()
                .remove();


            var onewaygroup = layergroup
                .selectAll('g.onewaygroup')
                .data(['oneway']);

            onewaygroup.enter()
                .append('g')
                .attr('class', 'layer onewaygroup');


            var oneways = onewaygroup
                .selectAll('path')
                .filter(filter)
                .data(
                    function() { return onewaydata[this.parentNode.parentNode.__data__] || []; },
                    function(d) { return [d.id, d.index]; }
                );

            oneways.enter()
                .append('path')
                .attr('class', 'oneway')
                .attr('marker-mid', 'url(#oneway-marker)');

            oneways
                .attr('d', function(d) { return d.d; });

            if (iD.detect().ie) {
                oneways.each(function() { this.parentNode.insertBefore(this, this); });
            }

            oneways.exit()
                .remove();

        };
    }

    function MapillaryImages(projection, context, dispatch) {
        var debouncedRedraw = _.debounce(function () { dispatch.change(); }, 1000),
            minZoom = 12,
            layer = d3.select(null),
            _mapillary;


        function init() {
            if (iD.svg.MapillaryImages.initialized) return;  // run once
            iD.svg.MapillaryImages.enabled = false;
            iD.svg.MapillaryImages.initialized = true;
        }

        function getMapillary() {
            if (iD.services.mapillary && !_mapillary) {
                _mapillary = iD.services.mapillary();
                _mapillary.on('loadedImages', debouncedRedraw);
            } else if (!iD.services.mapillary && _mapillary) {
                _mapillary = null;
            }

            return _mapillary;
        }

        function showLayer() {
            var mapillary = getMapillary();
            if (!mapillary) return;

            mapillary.loadViewer();
            editOn();

            layer
                .style('opacity', 0)
                .transition()
                .duration(500)
                .style('opacity', 1)
                .each('end', debouncedRedraw);
        }

        function hideLayer() {
            var mapillary = getMapillary();
            if (mapillary) {
                mapillary.hideViewer();
            }

            debouncedRedraw.cancel();

            layer
                .transition()
                .duration(500)
                .style('opacity', 0)
                .each('end', editOff);
        }

        function editOn() {
            layer.style('display', 'block');
        }

        function editOff() {
            layer.selectAll('.viewfield-group').remove();
            layer.style('display', 'none');
        }

        function click(d) {
            var mapillary = getMapillary();
            if (!mapillary) return;

            context.map().centerEase(d.loc);

            mapillary
                .setSelectedImage(d.key, true)
                .updateViewer(d.key, context)
                .showViewer();
        }

        function transform(d) {
            var t = iD.svg.PointTransform(projection)(d);
            if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
            return t;
        }

        function update() {
            var mapillary = getMapillary(),
                data = (mapillary ? mapillary.images(projection, layer.dimensions()) : []),
                imageKey = mapillary ? mapillary.getSelectedImage() : null;

            var markers = layer.selectAll('.viewfield-group')
                .data(data, function(d) { return d.key; });

            // Enter
            var enter = markers.enter()
                .append('g')
                .attr('class', 'viewfield-group')
                .classed('selected', function(d) { return d.key === imageKey; })
                .on('click', click);

            enter.append('path')
                .attr('class', 'viewfield')
                .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
                .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');

            enter.append('circle')
                .attr('dx', '0')
                .attr('dy', '0')
                .attr('r', '6');

            // Exit
            markers.exit()
                .remove();

            // Update
            markers
                .attr('transform', transform);
        }

        function drawImages(selection) {
            var enabled = iD.svg.MapillaryImages.enabled,
                mapillary = getMapillary();

            layer = selection.selectAll('.layer-mapillary-images')
                .data(mapillary ? [0] : []);

            layer.enter()
                .append('g')
                .attr('class', 'layer-mapillary-images')
                .style('display', enabled ? 'block' : 'none');

            layer.exit()
                .remove();

            if (enabled) {
                if (mapillary && ~~context.map().zoom() >= minZoom) {
                    editOn();
                    update();
                    mapillary.loadImages(projection, layer.dimensions());
                } else {
                    editOff();
                }
            }
        }

        drawImages.enabled = function(_) {
            if (!arguments.length) return iD.svg.MapillaryImages.enabled;
            iD.svg.MapillaryImages.enabled = _;
            if (iD.svg.MapillaryImages.enabled) {
                showLayer();
            } else {
                hideLayer();
            }
            dispatch.change();
            return this;
        };

        drawImages.supported = function() {
            return !!getMapillary();
        };

        drawImages.dimensions = function(_) {
            if (!arguments.length) return layer.dimensions();
            layer.dimensions(_);
            return this;
        };

        init();
        return drawImages;
    }

    function MapillarySigns(projection, context, dispatch) {
        var debouncedRedraw = _.debounce(function () { dispatch.change(); }, 1000),
            minZoom = 12,
            layer = d3.select(null),
            _mapillary;


        function init() {
            if (iD.svg.MapillarySigns.initialized) return;  // run once
            iD.svg.MapillarySigns.enabled = false;
            iD.svg.MapillarySigns.initialized = true;
        }

        function getMapillary() {
            if (iD.services.mapillary && !_mapillary) {
                _mapillary = iD.services.mapillary().on('loadedSigns', debouncedRedraw);
            } else if (!iD.services.mapillary && _mapillary) {
                _mapillary = null;
            }
            return _mapillary;
        }

        function showLayer() {
            editOn();
            debouncedRedraw();
        }

        function hideLayer() {
            debouncedRedraw.cancel();
            editOff();
        }

        function editOn() {
            layer.style('display', 'block');
        }

        function editOff() {
            layer.selectAll('.icon-sign').remove();
            layer.style('display', 'none');
        }

        function click(d) {
            var mapillary = getMapillary();
            if (!mapillary) return;

            context.map().centerEase(d.loc);

            mapillary
                .setSelectedImage(d.key, true)
                .updateViewer(d.key, context)
                .showViewer();
        }

        function update() {
            var mapillary = getMapillary(),
                data = (mapillary ? mapillary.signs(projection, layer.dimensions()) : []),
                imageKey = mapillary ? mapillary.getSelectedImage() : null;

            var signs = layer.selectAll('.icon-sign')
                .data(data, function(d) { return d.key; });

            // Enter
            var enter = signs.enter()
                .append('foreignObject')
                .attr('class', 'icon-sign')
                .attr('width', '32px')      // for Firefox
                .attr('height', '32px')     // for Firefox
                .classed('selected', function(d) { return d.key === imageKey; })
                .on('click', click);

            enter
                .append('xhtml:body')
                .html(mapillary.signHTML);

            // Exit
            signs.exit()
                .remove();

            // Update
            signs
                .attr('transform', iD.svg.PointTransform(projection));
        }

        function drawSigns(selection) {
            var enabled = iD.svg.MapillarySigns.enabled,
                mapillary = getMapillary();

            layer = selection.selectAll('.layer-mapillary-signs')
                .data(mapillary ? [0] : []);

            layer.enter()
                .append('g')
                .attr('class', 'layer-mapillary-signs')
                .style('display', enabled ? 'block' : 'none')
                .attr('transform', 'translate(-16, -16)');  // center signs on loc

            layer.exit()
                .remove();

            if (enabled) {
                if (mapillary && ~~context.map().zoom() >= minZoom) {
                    editOn();
                    update();
                    mapillary.loadSigns(context, projection, layer.dimensions());
                } else {
                    editOff();
                }
            }
        }

        drawSigns.enabled = function(_) {
            if (!arguments.length) return iD.svg.MapillarySigns.enabled;
            iD.svg.MapillarySigns.enabled = _;
            if (iD.svg.MapillarySigns.enabled) {
                showLayer();
            } else {
                hideLayer();
            }
            dispatch.change();
            return this;
        };

        drawSigns.supported = function() {
            var mapillary = getMapillary();
            return (mapillary && mapillary.signsSupported());
        };

        drawSigns.dimensions = function(_) {
            if (!arguments.length) return layer.dimensions();
            layer.dimensions(_);
            return this;
        };

        init();
        return drawSigns;
    }

    function Midpoints(projection, context) {
        return function drawMidpoints(surface, graph, entities, filter, extent) {
            var poly = extent.polygon(),
                midpoints = {};

            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];

                if (entity.type !== 'way')
                    continue;
                if (!filter(entity))
                    continue;
                if (context.selectedIDs().indexOf(entity.id) < 0)
                    continue;

                var nodes = graph.childNodes(entity);
                for (var j = 0; j < nodes.length - 1; j++) {

                    var a = nodes[j],
                        b = nodes[j + 1],
                        id = [a.id, b.id].sort().join('-');

                    if (midpoints[id]) {
                        midpoints[id].parents.push(entity);
                    } else {
                        if (iD.geo.euclideanDistance(projection(a.loc), projection(b.loc)) > 40) {
                            var point = iD.geo.interp(a.loc, b.loc, 0.5),
                                loc = null;

                            if (extent.intersects(point)) {
                                loc = point;
                            } else {
                                for (var k = 0; k < 4; k++) {
                                    point = iD.geo.lineIntersection([a.loc, b.loc], [poly[k], poly[k+1]]);
                                    if (point &&
                                        iD.geo.euclideanDistance(projection(a.loc), projection(point)) > 20 &&
                                        iD.geo.euclideanDistance(projection(b.loc), projection(point)) > 20)
                                    {
                                        loc = point;
                                        break;
                                    }
                                }
                            }

                            if (loc) {
                                midpoints[id] = {
                                    type: 'midpoint',
                                    id: id,
                                    loc: loc,
                                    edge: [a.id, b.id],
                                    parents: [entity]
                                };
                            }
                        }
                    }
                }
            }

            function midpointFilter(d) {
                if (midpoints[d.id])
                    return true;

                for (var i = 0; i < d.parents.length; i++)
                    if (filter(d.parents[i]))
                        return true;

                return false;
            }

            var groups = surface.selectAll('.layer-hit').selectAll('g.midpoint')
                .filter(midpointFilter)
                .data(_.values(midpoints), function(d) { return d.id; });

            var enter = groups.enter()
                .insert('g', ':first-child')
                .attr('class', 'midpoint');

            enter.append('polygon')
                .attr('points', '-6,8 10,0 -6,-8')
                .attr('class', 'shadow');

            enter.append('polygon')
                .attr('points', '-3,4 5,0 -3,-4')
                .attr('class', 'fill');

            groups
                .attr('transform', function(d) {
                    var translate = iD.svg.PointTransform(projection),
                        a = context.entity(d.edge[0]),
                        b = context.entity(d.edge[1]),
                        angle = Math.round(iD.geo.angle(a, b, projection) * (180 / Math.PI));
                    return translate(d) + ' rotate(' + angle + ')';
                })
                .call(iD.svg.TagClasses().tags(
                    function(d) { return d.parents[0].tags; }
                ));

            // Propagate data bindings.
            groups.select('polygon.shadow');
            groups.select('polygon.fill');

            groups.exit()
                .remove();
        };
    }

    function OneWaySegments(projection, graph, dt) {
        return function(entity) {
            var a,
                b,
                i = 0,
                offset = dt,
                segments = [],
                clip = d3.geo.clipExtent().extent(projection.clipExtent()).stream,
                coordinates = graph.childNodes(entity).map(function(n) {
                    return n.loc;
                });

            if (entity.tags.oneway === '-1') coordinates.reverse();

            d3.geo.stream({
                type: 'LineString',
                coordinates: coordinates
            }, projection.stream(clip({
                lineStart: function() {},
                lineEnd: function() {
                    a = null;
                },
                point: function(x, y) {
                    b = [x, y];

                    if (a) {
                        var span = iD.geo.euclideanDistance(a, b) - offset;

                        if (span >= 0) {
                            var angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
                                dx = dt * Math.cos(angle),
                                dy = dt * Math.sin(angle),
                                p = [a[0] + offset * Math.cos(angle),
                                     a[1] + offset * Math.sin(angle)];

                            var segment = 'M' + a[0] + ',' + a[1] +
                                          'L' + p[0] + ',' + p[1];

                            for (span -= dt; span >= 0; span -= dt) {
                                p[0] += dx;
                                p[1] += dy;
                                segment += 'L' + p[0] + ',' + p[1];
                            }

                            segment += 'L' + b[0] + ',' + b[1];
                            segments.push({id: entity.id, index: i, d: segment});
                        }

                        offset = -span;
                        i++;
                    }

                    a = b;
                }
            })));

            return segments;
        };
    }

    function Osm() {
        return function drawOsm(selection) {
            var layers = selection.selectAll('.layer-osm')
                .data(['areas', 'lines', 'hit', 'halo', 'label']);

            layers.enter().append('g')
                .attr('class', function(d) { return 'layer-osm layer-' + d; });
        };
    }

    function Path(projection, graph, polygon) {
        var cache = {},
            clip = d3.geo.clipExtent().extent(projection.clipExtent()).stream,
            project = projection.stream,
            path = d3.geo.path()
                .projection({stream: function(output) { return polygon ? project(output) : project(clip(output)); }});

        return function(entity) {
            if (entity.id in cache) {
                return cache[entity.id];
            } else {
                return cache[entity.id] = path(entity.asGeoJSON(graph));
            }
        };
    }

    function PointTransform(projection) {
        return function(entity) {
            // http://jsperf.com/short-array-join
            var pt = projection(entity.loc);
            return 'translate(' + pt[0] + ',' + pt[1] + ')';
        };
    }

    function Points(projection, context) {
        function markerPath(selection, klass) {
            selection
                .attr('class', klass)
                .attr('transform', 'translate(-8, -23)')
                .attr('d', 'M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z');
        }

        function sortY(a, b) {
            return b.loc[1] - a.loc[1];
        }

        return function drawPoints(surface, graph, entities, filter) {
            var wireframe = surface.classed('fill-wireframe'),
                points = wireframe ? [] : _.filter(entities, function(e) {
                    return e.geometry(graph) === 'point';
                });

            points.sort(sortY);

            var groups = surface.selectAll('.layer-hit').selectAll('g.point')
                .filter(filter)
                .data(points, iD.Entity.key);

            var group = groups.enter()
                .append('g')
                .attr('class', function(d) { return 'node point ' + d.id; })
                .order();

            group.append('path')
                .call(markerPath, 'shadow');

            group.append('path')
                .call(markerPath, 'stroke');

            group.append('use')
                .attr('transform', 'translate(-6, -20)')
                .attr('class', 'icon')
                .attr('width', '12px')
                .attr('height', '12px');

            groups.attr('transform', iD.svg.PointTransform(projection))
                .call(iD.svg.TagClasses());

            // Selecting the following implicitly
            // sets the data (point entity) on the element
            groups.select('.shadow');
            groups.select('.stroke');
            groups.select('.icon')
                .attr('xlink:href', function(entity) {
                    var preset = context.presets().match(entity, graph);
                    return preset.icon ? '#' + preset.icon + '-12' : '';
                });

            groups.exit()
                .remove();
        };
    }

    function RelationMemberTags(graph) {
        return function(entity) {
            var tags = entity.tags;
            graph.parentRelations(entity).forEach(function(relation) {
                var type = relation.tags.type;
                if (type === 'multipolygon' || type === 'boundary') {
                    tags = _.extend({}, relation.tags, tags);
                }
            });
            return tags;
        };
    }

    function TagClasses() {
        var primaries = [
                'building', 'highway', 'railway', 'waterway', 'aeroway',
                'motorway', 'boundary', 'power', 'amenity', 'natural', 'landuse',
                'leisure', 'place'
            ],
            statuses = [
                'proposed', 'construction', 'disused', 'abandoned', 'dismantled',
                'razed', 'demolished', 'obliterated'
            ],
            secondaries = [
                'oneway', 'bridge', 'tunnel', 'embankment', 'cutting', 'barrier',
                'surface', 'tracktype', 'crossing'
            ],
            tagClassRe = /^tag-/,
            tags = function(entity) { return entity.tags; };


        var tagClasses = function(selection) {
            selection.each(function tagClassesEach(entity) {
                var value = this.className,
                    classes, primary, status;

                if (value.baseVal !== undefined) value = value.baseVal;

                classes = value.trim().split(/\s+/).filter(function(name) {
                    return name.length && !tagClassRe.test(name);
                }).join(' ');

                var t = tags(entity), i, k, v;

                // pick at most one primary classification tag..
                for (i = 0; i < primaries.length; i++) {
                    k = primaries[i];
                    v = t[k];
                    if (!v || v === 'no') continue;

                    primary = k;
                    if (statuses.indexOf(v) !== -1) {   // e.g. `railway=abandoned`
                        status = v;
                        classes += ' tag-' + k;
                    } else {
                        classes += ' tag-' + k + ' tag-' + k + '-' + v;
                    }

                    break;
                }

                // add at most one status tag, only if relates to primary tag..
                if (!status) {
                    for (i = 0; i < statuses.length; i++) {
                        k = statuses[i];
                        v = t[k];
                        if (!v || v === 'no') continue;

                        if (v === 'yes') {   // e.g. `railway=rail + abandoned=yes`
                            status = k;
                        }
                        else if (primary && primary === v) {  // e.g. `railway=rail + abandoned=railway`
                            status = k;
                        } else if (!primary && primaries.indexOf(v) !== -1) {  // e.g. `abandoned=railway`
                            status = k;
                            primary = v;
                            classes += ' tag-' + v;
                        }  // else ignore e.g.  `highway=path + abandoned=railway`

                        if (status) break;
                    }
                }

                if (status) {
                    classes += ' tag-status tag-status-' + status;
                }

                // add any secondary (structure) tags
                for (i = 0; i < secondaries.length; i++) {
                    k = secondaries[i];
                    v = t[k];
                    if (!v || v === 'no') continue;
                    classes += ' tag-' + k + ' tag-' + k + '-' + v;
                }

                // For highways, look for surface tagging..
                if (primary === 'highway') {
                    var paved = (t.highway !== 'track');
                    for (k in t) {
                        v = t[k];
                        if (k in iD.pavedTags) {
                            paved = !!iD.pavedTags[k][v];
                            break;
                        }
                    }
                    if (!paved) {
                        classes += ' tag-unpaved';
                    }
                }

                classes = classes.trim();

                if (classes !== value) {
                    d3.select(this).attr('class', classes);
                }
            });
        };

        tagClasses.tags = function(_) {
            if (!arguments.length) return tags;
            tags = _;
            return tagClasses;
        };

        return tagClasses;
    }

    function Turns(projection) {
        return function drawTurns(surface, graph, turns) {
            function key(turn) {
                return [turn.from.node + turn.via.node + turn.to.node].join('-');
            }

            function icon(turn) {
                var u = turn.u ? '-u' : '';
                if (!turn.restriction)
                    return '#turn-yes' + u;
                var restriction = graph.entity(turn.restriction).tags.restriction;
                return '#turn-' +
                    (!turn.indirect_restriction && /^only_/.test(restriction) ? 'only' : 'no') + u;
            }

            var groups = surface.selectAll('.layer-hit').selectAll('g.turn')
                .data(turns, key);

            // Enter
            var enter = groups.enter().append('g')
                .attr('class', 'turn');

            var nEnter = enter.filter(function (turn) { return !turn.u; });

            nEnter.append('rect')
                .attr('transform', 'translate(-22, -12)')
                .attr('width', '44')
                .attr('height', '24');

            nEnter.append('use')
                .attr('transform', 'translate(-22, -12)')
                .attr('width', '44')
                .attr('height', '24');


            var uEnter = enter.filter(function (turn) { return turn.u; });

            uEnter.append('circle')
                .attr('r', '16');

            uEnter.append('use')
                .attr('transform', 'translate(-16, -16)')
                .attr('width', '32')
                .attr('height', '32');


            // Update
            groups
                .attr('transform', function (turn) {
                    var v = graph.entity(turn.via.node),
                        t = graph.entity(turn.to.node),
                        a = iD.geo.angle(v, t, projection),
                        p = projection(v.loc),
                        r = turn.u ? 0 : 60;

                    return 'translate(' + (r * Math.cos(a) + p[0]) + ',' + (r * Math.sin(a) + p[1]) + ') ' +
                        'rotate(' + a * 180 / Math.PI + ')';
                });

            groups.select('use')
                .attr('xlink:href', icon);

            groups.select('rect');
            groups.select('circle');


            // Exit
            groups.exit()
                .remove();

            return this;
        };
    }

    function Vertices(projection, context) {
        var radiuses = {
            //       z16-, z17, z18+, tagged
            shadow: [6,    7.5,   7.5,  11.5],
            stroke: [2.5,  3.5,   3.5,  7],
            fill:   [1,    1.5,   1.5,  1.5]
        };

        var hover;

        function siblingAndChildVertices(ids, graph, extent) {
            var vertices = {};

            function addChildVertices(entity) {
                if (!context.features().isHiddenFeature(entity, graph, entity.geometry(graph))) {
                    var i;
                    if (entity.type === 'way') {
                        for (i = 0; i < entity.nodes.length; i++) {
                            addChildVertices(graph.entity(entity.nodes[i]));
                        }
                    } else if (entity.type === 'relation') {
                        for (i = 0; i < entity.members.length; i++) {
                            var member = context.hasEntity(entity.members[i].id);
                            if (member) {
                                addChildVertices(member);
                            }
                        }
                    } else if (entity.intersects(extent, graph)) {
                        vertices[entity.id] = entity;
                    }
                }
            }

            ids.forEach(function(id) {
                var entity = context.hasEntity(id);
                if (entity && entity.type === 'node') {
                    vertices[entity.id] = entity;
                    context.graph().parentWays(entity).forEach(function(entity) {
                        addChildVertices(entity);
                    });
                } else if (entity) {
                    addChildVertices(entity);
                }
            });

            return vertices;
        }

        function draw(selection, vertices, klass, graph, zoom) {
            var icons = {},
                z = (zoom < 17 ? 0 : zoom < 18 ? 1 : 2);

            var groups = selection
                .data(vertices, iD.Entity.key);

            function icon(entity) {
                if (entity.id in icons) return icons[entity.id];
                icons[entity.id] =
                    entity.hasInterestingTags() &&
                    context.presets().match(entity, graph).icon;
                return icons[entity.id];
            }

            function setClass(klass) {
                return function(entity) {
                    this.setAttribute('class', 'node vertex ' + klass + ' ' + entity.id);
                };
            }

            function setAttributes(selection) {
                ['shadow','stroke','fill'].forEach(function(klass) {
                    var rads = radiuses[klass];
                    selection.selectAll('.' + klass)
                        .each(function(entity) {
                            var i = z && icon(entity),
                                c = i ? 0.5 : 0,
                                r = rads[i ? 3 : z];
                            this.setAttribute('cx', c);
                            this.setAttribute('cy', -c);
                            this.setAttribute('r', r);
                            if (i && klass === 'fill') {
                                this.setAttribute('visibility', 'hidden');
                            } else {
                                this.removeAttribute('visibility');
                            }
                        });
                });

                selection.selectAll('use')
                    .each(function() {
                        if (z) {
                            this.removeAttribute('visibility');
                        } else {
                            this.setAttribute('visibility', 'hidden');
                        }
                    });
            }

            var enter = groups.enter()
                .append('g')
                .attr('class', function(d) { return 'node vertex ' + klass + ' ' + d.id; });

            enter.append('circle')
                .each(setClass('shadow'));

            enter.append('circle')
                .each(setClass('stroke'));

            // Vertices with icons get a `use`.
            enter.filter(function(d) { return icon(d); })
                .append('use')
                .attr('transform', 'translate(-6, -6)')
                .attr('xlink:href', function(d) { return '#' + icon(d) + '-12'; })
                .attr('width', '12px')
                .attr('height', '12px')
                .each(setClass('icon'));

            // Vertices with tags get a fill.
            enter.filter(function(d) { return d.hasInterestingTags(); })
                .append('circle')
                .each(setClass('fill'));

            groups
                .attr('transform', iD.svg.PointTransform(projection))
                .classed('shared', function(entity) { return graph.isShared(entity); })
                .call(setAttributes);

            groups.exit()
                .remove();
        }

        function drawVertices(surface, graph, entities, filter, extent, zoom) {
            var selected = siblingAndChildVertices(context.selectedIDs(), graph, extent),
                wireframe = surface.classed('fill-wireframe'),
                vertices = [];

            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i],
                    geometry = entity.geometry(graph);

                if (wireframe && geometry === 'point') {
                    vertices.push(entity);
                    continue;
                }

                if (geometry !== 'vertex')
                    continue;

                if (entity.id in selected ||
                    entity.hasInterestingTags() ||
                    entity.isIntersection(graph)) {
                    vertices.push(entity);
                }
            }

            surface.selectAll('.layer-hit').selectAll('g.vertex.vertex-persistent')
                .filter(filter)
                .call(draw, vertices, 'vertex-persistent', graph, zoom);

            drawHover(surface, graph, extent, zoom);
        }

        function drawHover(surface, graph, extent, zoom) {
            var hovered = hover ? siblingAndChildVertices([hover.id], graph, extent) : {};

            surface.selectAll('.layer-hit').selectAll('g.vertex.vertex-hover')
                .call(draw, d3.values(hovered), 'vertex-hover', graph, zoom);
        }

        drawVertices.drawHover = function(surface, graph, target, extent, zoom) {
            if (target === hover) return;
            hover = target;
            drawHover(surface, graph, extent, zoom);
        };

        return drawVertices;
    }

    exports.Areas = Areas;
    exports.Debug = Debug;
    exports.Defs = Defs;
    exports.Gpx = Gpx;
    exports.Icon = Icon;
    exports.Labels = Labels;
    exports.Layers = Layers;
    exports.Lines = Lines;
    exports.MapillaryImages = MapillaryImages;
    exports.MapillarySigns = MapillarySigns;
    exports.Midpoints = Midpoints;
    exports.OneWaySegments = OneWaySegments;
    exports.Osm = Osm;
    exports.Path = Path;
    exports.PointTransform = PointTransform;
    exports.Points = Points;
    exports.RelationMemberTags = RelationMemberTags;
    exports.TagClasses = TagClasses;
    exports.Turns = Turns;
    exports.Vertices = Vertices;

    Object.defineProperty(exports, '__esModule', { value: true });

}));