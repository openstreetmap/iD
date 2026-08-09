import { deepEqual } from 'fast-equals';
import { range as d3_range } from 'd3-array';

import {
    svgAttrIfChanged, svgMarkerSegments, svgPath, svgRelationMemberTags, svgSegmentWay
} from './helpers';
import { svgTagClasses } from './tag_classes';

import { osmIdManager } from '../osm';
import { utilArrayFlatten, utilArrayGroupBy } from '../util';
import { utilDetect } from '../util/detect';

/** @param {{ [key: string ]: string }} tags */
function onewayArrowColour(tags) {
    // the return value must be defined in ./defs.js
    if (tags.highway === 'construction' && tags.bridge) return 'white';
    if (tags.highway === 'pedestrian') return 'gray';
    if (tags.railway && !tags.highway) return 'gray';
    if (tags.aeroway === 'runway') return 'white';

    return 'black';
}

export function svgLines(projection, context) {
    var detected = utilDetect();

    // Hoisted per renderer so the class memo's `_id` is stable across
    // redraws and the memo can actually hit on pan/zoom. Two instances:
    // one per distinct `tags` getter (own tags on enter, relation tags on
    // update) - sharing one instance would let the second pass hit memo
    // entries computed with the other pass's tags getter.
    var tagClasses = svgTagClasses();
    var tagClassesRelation = svgTagClasses();

    // Hoisted per renderer so the sort memo is stable across redraws and
    // can actually hit on pan/zoom. waystack reads only the selected set
    // and each way's tags, so a linegroup whose data and selection are
    // unchanged since the last draw is already in stack order and can skip
    // the sort, which would otherwise reorder every path via the DOM.
    var sortCache = {};

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
        busway: 11,
        footway: 12
    };


    function drawTargets(selection, graph, entities, filter) {
        var targetClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var nopeClass = context.getDebug('target') ? 'red ' : 'nocolor ';
        var getPath = svgPath(projection).geojson;
        var activeID = context.activeID();
        var base = context.history().base();

        // The targets and nopes will be MultiLineString sub-segments of the ways
        var data = { targets: [], nopes: [] };

        entities.forEach(function(way) {
            var features = svgSegmentWay(way, graph, activeID);
            data.targets.push.apply(data.targets, features.passive);
            data.nopes.push.apply(data.nopes, features.active);
        });


        // Targets allow hover and vertex snapping
        var targetData = data.targets.filter(getPath);
        var targets = selection.selectAll('.line.target-allowed')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(targetData, function key(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        var segmentWasEdited = function(d) {
            var wayID = d.properties.entity.id;
            // if the whole line was edited, don't draw segment changes
            if (!base.entities[wayID] ||
                !deepEqual(graph.entities[wayID].nodes, base.entities[wayID].nodes)) {
                return false;
            }
            return d.properties.nodes.some(function(n) {
                return !base.entities[n.id] ||
                       !deepEqual(graph.entities[n.id].loc, base.entities[n.id].loc);
            });
        };

        // enter/update
        targets.enter()
            .append('path')
            .merge(targets)
            .call(svgAttrIfChanged, 'd', getPath)
            .attr('class', function(d) {
                return 'way line target target-allowed ' + targetClass + d.id;
            })
            .classed('segment-edited', segmentWasEdited);

        // NOPE
        var nopeData = data.nopes.filter(getPath);
        var nopes = selection.selectAll('.line.target-nope')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(nopeData, function key(d) { return d.id; });

        // exit
        nopes.exit()
            .remove();

        // enter/update
        nopes.enter()
            .append('path')
            .merge(nopes)
            .call(svgAttrIfChanged, 'd', getPath)
            .attr('class', function(d) {
                return 'way line target target-nope ' + nopeClass + d.id;
            })
            .classed('segment-edited', segmentWasEdited);
    }


    function drawLines(selection, graph, entities, filter) {
        var base = context.history().base();

        // Snapshot the selection once for this draw. The layer filter and
        // waystack both test membership per way, and the selection cannot
        // change mid-draw, so capture it in a Set instead of calling
        // selectedIDs() per entity per linegroup pass.
        var selected = new Set(context.selectedIDs());

        // waystack sorts by selection and highway rank, so the order can
        // change only when the selection or the data changes. Snapshot the
        // selection so the sort can be skipped when neither changed.
        var selectedSig = context.selectedIDs().slice().sort().join(',');

        function waystack(a, b) {
            var scoreA = selected.has(a.id) ? 20 : 0;
            var scoreB = selected.has(b.id) ? 20 : 0;

            if (a.tags.highway) { scoreA -= highway_stack[a.tags.highway]; }
            if (b.tags.highway) { scoreB -= highway_stack[b.tags.highway]; }
            return scoreA - scoreB;
        }

        function sameSequence(a, b) {
            if (a.length !== b.length) return false;
            for (var i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }


        function drawLineGroup(selection, klass, isSelected) {
            // Note: Don't add `.selected` class in draw modes
            var mode = context.mode();
            var isDrawing = mode && /^draw/.test(mode.id);
            var selectedClass = (!isDrawing && isSelected) ? 'selected ' : '';

            // Data and linegroup node per layer, captured while the join
            // runs so the sort skip below can compare without re-reading
            // the DOM
            var layerData = {};
            var layerNodes = {};
            var getData = getPathData(isSelected);

            var lines = selection
                .selectAll('path')
                .filter(filter)
                .data(function() {
                    var layer = this.parentNode.__data__;
                    layerData[layer] = getData.call(this);
                    layerNodes[layer] = this;
                    return layerData[layer];
                }, osmIdManager.key);

            lines.exit()
                .remove();

            // Optimization: Call expensive TagClasses only on enter selection. This
            // works because osmIdManager.key is defined to include the entity v attribute.
            lines = lines.enter()
                .append('path')
                .attr('class', function(d) {

                    var prefix = 'way line';

                    // if this line isn't styled by its own tags
                    if (!d.hasInterestingTags()) {

                        var parentRelations = graph.parentRelations(d);
                        var parentMultipolygons = parentRelations.filter(function(relation) {
                            return relation.isMultipolygon();
                        });

                        // and if it's a member of at least one multipolygon relation
                        if (parentMultipolygons.length > 0 &&
                            // and only multipolygon relations
                            parentRelations.length === parentMultipolygons.length) {
                            // then fudge the classes to style this as an area edge
                            prefix = 'relation area';
                        }
                    }

                    var oldMPClass = oldMultiPolygonOuters[d.id] ? 'old-multipolygon ' : '';
                    return prefix + ' ' + klass + ' ' + selectedClass + oldMPClass + d.id;
                })
                .classed('added', function(d) {
                    return !base.entities[d.id];
                })
                .classed('geometry-edited', function(d) {
                    return graph.entities[d.id] &&
                        base.entities[d.id] &&
                        !deepEqual(graph.entities[d.id].nodes, base.entities[d.id].nodes);
                })
                .classed('retagged', function(d) {
                    return graph.entities[d.id] &&
                        base.entities[d.id] &&
                        !deepEqual(graph.entities[d.id].tags, base.entities[d.id].tags);
                })
                .call(tagClasses.graph(graph))
                .merge(lines);

            // Skip the sort when the data and selection are unchanged since
            // the last draw of this linegroup: the DOM is then already in
            // stack order. Sorting would otherwise reorder every path via
            // the DOM, one compareDocumentPosition at a time. The cache key
            // includes the highlighted suffix because klass is shared by the
            // normal and highlighted linegroups, and the covered and
            // uncovered layer passes share the entry, safe because the two
            // layer ranges are disjoint.
            var cacheKey = klass + (isSelected ? ' highlighted' : '');
            var entry = sortCache[cacheKey];
            var unchanged = !!(entry && entry.sig === selectedSig);
            var layer;
            if (unchanged) {
                for (layer in layerData) {
                    if (entry.nodes[layer] !== layerNodes[layer] ||
                        !sameSequence(entry.data[layer], layerData[layer])) {
                        unchanged = false;
                        break;
                    }
                }
            }

            // The memo is refreshed only when a sort actually runs, a skip
            // leaves it untouched.
            if (!unchanged) {
                lines.sort(waystack);
                entry = sortCache[cacheKey] ||
                    (sortCache[cacheKey] = { sig: selectedSig, data: {}, nodes: {} });
                entry.sig = selectedSig;
                for (layer in layerData) {
                    entry.data[layer] = layerData[layer];
                    entry.nodes[layer] = layerNodes[layer];
                }
            }

            lines.call(svgAttrIfChanged, 'd', getPath)
                .call(tagClassesRelation.tags(svgRelationMemberTags(graph)).graph(graph));

            return selection;
        }


        function getPathData(isSelected) {
            return function() {
                var layer = this.parentNode.__data__;
                var data = pathdata[layer] || [];
                return data.filter(function(d) {
                    var isSel = selected.has(d.id);
                    return isSelected ? isSel : !isSel;
                });
            };
        }

        function addMarkers(layergroup, pathclass, groupclass, groupdata, marker) {
            var markergroup = layergroup
                .selectAll('g.' + groupclass)
                .data([pathclass]);

            markergroup = markergroup.enter()
                .append('g')
                .attr('class', groupclass)
                .merge(markergroup);

            var markers = markergroup
                .selectAll('path')
                .filter(filter)
                .data(
                    function data() { return groupdata[this.parentNode.__data__] || []; },
                    function key(d) { return [d.id, d.index]; }
                );

            markers.exit()
                .remove();

            markers = markers.enter()
                .append('path')
                .attr('class', pathclass)
                .merge(markers)
                .attr('marker-mid', marker)
                .call(svgAttrIfChanged, 'd', d => d.d);

            if (detected.ie) {
                markers.each(function() { this.parentNode.insertBefore(this, this); });
            }
        }


        var getPath = svgPath(projection, graph);
        var ways = [];
        var onewaydata = {};
        var sideddata = {};
        var oldMultiPolygonOuters = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) === 'line'
                       // to render side-markers for coastlines (see
                       // https://github.com/openstreetmap/iD/issues/9293)
                    || entity.geometry(graph) === 'area' && entity.sidednessIdentifier
                        && entity.sidednessIdentifier() === 'coastline') {
                ways.push(entity);
            }
        }

        ways = ways.filter(getPath);
        const pathdata = utilArrayGroupBy(ways, (way) => Math.trunc(way.layer()));

        Object.keys(pathdata).forEach(function(k) {
            var v = pathdata[k];
            var onewayArr = v.filter(function(d) { return d.isOneWay(); });
            var onewaySegments = svgMarkerSegments(
                projection, graph, 36,
                entity => entity.isOneWayBackwards(),
                entity => entity.isBiDirectional(),
            );
            onewaydata[k] = utilArrayFlatten(onewayArr.map(onewaySegments));

            var sidedArr = v.filter(function(d) { return d.isSided(); });
            var sidedSegments = svgMarkerSegments(
                projection, graph, 30
            );
            sideddata[k] = utilArrayFlatten(sidedArr.map(sidedSegments));
        });


        var covered = selection.selectAll('.layer-osm.covered');     // under areas
        var uncovered = selection.selectAll('.layer-osm.lines');     // over areas
        var touchLayer = selection.selectAll('.layer-touch.lines');

        // Draw lines..
        [covered, uncovered].forEach(function(selection) {
            var range = (selection === covered ? d3_range(-10,0) : d3_range(0,11));
            var layergroup = selection
                .selectAll('g.layergroup')
                .data(range);

            layergroup = layergroup.enter()
                .append('g')
                .attr('class', function(d) { return 'layergroup layer' + String(d); })
                .merge(layergroup);

            layergroup
                .selectAll('g.linegroup')
                .data(['shadow', 'casing', 'stroke', 'shadow-highlighted', 'casing-highlighted', 'stroke-highlighted'])
                .enter()
                .append('g')
                .attr('class', function(d) { return 'linegroup line-' + d; });

            layergroup.selectAll('g.line-shadow')
                .call(drawLineGroup, 'shadow', false);
            layergroup.selectAll('g.line-casing')
                .call(drawLineGroup, 'casing', false);
            layergroup.selectAll('g.line-stroke')
                .call(drawLineGroup, 'stroke', false);

            layergroup.selectAll('g.line-shadow-highlighted')
                .call(drawLineGroup, 'shadow', true);
            layergroup.selectAll('g.line-casing-highlighted')
                .call(drawLineGroup, 'casing', true);
            layergroup.selectAll('g.line-stroke-highlighted')
                .call(drawLineGroup, 'stroke', true);

            addMarkers(layergroup, 'oneway', 'onewaygroup', onewaydata, (d) => {
                const category = onewayArrowColour(graph.entity(d.id).tags);
                return `url(#ideditor-oneway-marker-${category})`;
            });
            addMarkers(layergroup, 'sided', 'sidedgroup', sideddata,
                function marker(d) {
                    var category = graph.entity(d.id).sidednessIdentifier();
                    return 'url(#ideditor-sided-marker-' + category + ')';
                }
            );
        });

        // Draw touch targets..
        touchLayer
            .call(drawTargets, graph, ways, filter);
    }


    return drawLines;
}
