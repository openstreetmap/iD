import deepEqual from 'fast-deep-equal';
import { bisector as d3_bisector } from 'd3-array';

import { osmEntity, osmIsOldMultipolygonOuterMember } from '../osm';
import { svgPath, svgSegmentWay } from './helpers';
import { svgTagClasses } from './tag_classes';
import { svgTagPattern } from './tag_pattern';

export function svgAreas(projection, context) {


    function getPatternStyle(tags) {
        var imageID = svgTagPattern(tags);
        if (imageID) {
            return 'url("#ideditor-' + imageID + '")';
        }
        return '';
    }


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
        var targets = selection.selectAll('.area.target-allowed')
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
            .attr('d', getPath)
            .attr('class', function(d) { return 'way area target target-allowed ' + targetClass + d.id; })
            .classed('segment-edited', segmentWasEdited);


        // NOPE
        var nopeData = data.nopes.filter(getPath);
        var nopes = selection.selectAll('.area.target-nope')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(nopeData, function key(d) { return d.id; });

        // exit
        nopes.exit()
            .remove();

        // enter/update
        nopes.enter()
            .append('path')
            .merge(nopes)
            .attr('d', getPath)
            .attr('class', function(d) { return 'way area target target-nope ' + nopeClass + d.id; })
            .classed('segment-edited', segmentWasEdited);
    }


    function drawAreas(selection, graph, entities, filter) {
        var path = svgPath(projection, graph, true);
        var areas = {};
        var multipolygon;
        var base = context.history().base();

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;

            multipolygon = osmIsOldMultipolygonOuterMember(entity, graph);
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

        var fills = Object.values(areas).filter(function hasPath(a) { return path(a.entity); });
        fills.sort(function areaSort(a, b) { return b.area - a.area; });
        fills = fills.map(function(a) { return a.entity; });

        var strokes = fills.filter(function(area) { return area.type === 'way'; });

        var data = {
            clip: fills,
            shadow: strokes,
            stroke: strokes,
            fill: fills
        };

        var clipPaths = context.surface().selectAll('defs').selectAll('.clipPath-osm')
           .filter(filter)
           .data(data.clip, osmEntity.key);

        clipPaths.exit()
           .remove();

        var clipPathsEnter = clipPaths.enter()
           .append('clipPath')
           .attr('class', 'clipPath-osm')
           .attr('id', function(entity) { return 'ideditor-' + entity.id + '-clippath'; });

        clipPathsEnter
           .append('path');

        clipPaths.merge(clipPathsEnter)
           .selectAll('path')
           .attr('d', path);


        var drawLayer = selection.selectAll('.layer-osm.areas');
        var touchLayer = selection.selectAll('.layer-touch.areas');

        // Draw areas..
        var areagroup = drawLayer
            .selectAll('g.areagroup')
            .data(['fill', 'shadow', 'stroke']);

        areagroup = areagroup.enter()
            .append('g')
            .attr('class', function(d) { return 'areagroup area-' + d; })
            .merge(areagroup);

        var paths = areagroup
            .selectAll('path')
            .filter(filter)
            .data(function(layer) { return data[layer]; }, osmEntity.key);

        paths.exit()
            .remove();


        var fillpaths = selection.selectAll('.area-fill path.area').nodes();
        var bisect = d3_bisector(function(node) { return -node.__data__.area(graph); }).left;

        function sortedByArea(entity) {
            if (this._parent.__data__ === 'fill') {
                return fillpaths[bisect(fillpaths, -entity.area(graph))];
            }
        }

        paths = paths.enter()
            .insert('path', sortedByArea)
            .merge(paths)
            .each(function(entity) {
                var layer = this.parentNode.__data__;
                this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                if (layer === 'fill') {
                    this.setAttribute('clip-path', 'url(#ideditor-' + entity.id + '-clippath)');
                    this.style.fill = this.style.stroke = getPatternStyle(entity.tags);
                }
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
            .call(svgTagClasses())
            .attr('d', path);


        // Draw touch targets..
        touchLayer
            .call(drawTargets, graph, data.stroke, filter);
    }

    return drawAreas;
}
