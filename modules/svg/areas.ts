import { deepEqual } from 'fast-equals';
import { bisector as d3_bisector } from 'd3-array';

import { osmIdManager, osmWay, type osmNode, type WayId } from '../osm';
import { svgPath, svgSegmentWay, type SegmentFeature } from './helpers';
import { svgTagClasses } from './tag_classes';
import { svgTagPattern } from './tag_pattern';
import type { Projection } from '../geo/raw_mercator';
import type { coreGraph } from '../core';

export function svgAreas(projection: Projection, context: iD.Context) {


    function getPatternStyle(tags: Tags) {
        var imageID = svgTagPattern(tags);
        if (imageID) {
            return 'url("#ideditor-' + imageID + '")';
        }
        return '';
    }


    function drawTargets(selection: d3.Selection, graph: coreGraph, entities: osmWay[], filter: (way: osmWay) => boolean) {
        var targetClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var nopeClass = context.getDebug('target') ? 'red ' : 'nocolor ';
        var getPath = svgPath(projection).geojson;
        var activeID = context.activeID();
        var base = context.history().base();

        // The targets and nopes will be MultiLineString sub-segments of the ways
        var data: { targets: SegmentFeature[]; nopes: SegmentFeature[] } = { targets: [], nopes: [] };

        entities.forEach(function(way) {
            var features = svgSegmentWay(way, graph, activeID);
            data.targets.push.apply(data.targets, features.passive);
            data.nopes.push.apply(data.nopes, features.active);
        });


        // Targets allow hover and vertex snapping
        var targetData = data.targets.filter(getPath);
        var targets = selection.selectAll<SVGPathElement, SegmentFeature>('.area.target-allowed')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(targetData, function key(d) { return d.id!; });

        // exit
        targets.exit()
            .remove();

        var segmentWasEdited = function(d: SegmentFeature) {
            var wayID = d.properties.entity.id;
            // if the whole line was edited, don't draw segment changes
            if (!base.entities[wayID] ||
                !deepEqual((graph.entities[wayID] as osmWay).nodes, (base.entities[wayID] as osmWay).nodes)) {
                return false;
            }
            return d.properties.nodes.some(function(n) {
                return !base.entities[n.id] ||
                       !deepEqual((graph.entities[n.id] as osmNode).loc, (base.entities[n.id] as osmNode).loc);
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
        var nopes = selection.selectAll<SVGPathElement, SegmentFeature>('.area.target-nope')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(nopeData, function key(d) { return d.id!; });

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


    function drawAreas(selection: d3.Selection, graph: coreGraph, entities: osmWay[], filter: (way: osmWay) => boolean) {
        var path = svgPath(projection, graph, true);
        var areas: Record<WayId, { entity: osmWay; area: number }> = {};
        var base = context.history().base();

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) !== 'area') continue;
            if (!areas[entity.id]) {
                areas[entity.id] = {
                    entity: entity,
                    area: Math.abs(entity.area(graph))
                };
            }
        }

        var fills1 = Object.values(areas).filter(function hasPath(a) { return path(a.entity); });
        fills1.sort(function areaSort(a, b) { return b.area - a.area; });
        const fills = fills1.map(function(a) { return a.entity; });

        var strokes = fills.filter(function(area) { return area.type === 'way'; });

        var data = {
            clip: fills,
            shadow: strokes,
            stroke: strokes,
            fill: fills
        };

        var clipPaths = context.surface().selectAll('defs').selectAll<SVGClipPathElement, osmWay>('.clipPath-osm')
           .filter(filter)
           .data<osmWay>(data.clip, osmIdManager.key);

        clipPaths.exit()
           .remove();

        var clipPathsEnter = clipPaths.enter()
           .append('clipPath')
           .attr('class', 'clipPath-osm')
           .attr('id', function(entity) { return 'ideditor-' + entity.id + '-clippath'; });

        clipPathsEnter
           .append('path');

        clipPaths.merge(clipPathsEnter)
           .selectAll<SVGPathElement, osmWay>('path')
           .attr('d', path);


        var drawLayer = selection.selectAll<SVGGElement, osmWay>('.layer-osm.areas');
        var touchLayer = selection.selectAll('.layer-touch.areas');

        // Draw areas..
        var areagroup = drawLayer
            .selectAll<SVGGElement, osmWay>('g.areagroup')
            .data<'fill' | 'shadow' | 'stroke'>(['fill', 'shadow', 'stroke']);

        areagroup = areagroup.enter()
            .append('g')
            .attr('class', function(d) { return 'areagroup area-' + d; })
            .merge(areagroup);

        var paths = areagroup
            .selectAll<SVGPathElement, osmWay>('path')
            .filter(filter)
            .data<osmWay>(function(layer) { return data[layer]; }, osmIdManager.key);

        paths.exit()
            .remove();


        var fillpaths = selection.selectAll<SVGPathElement, osmWay>('.area-fill path.area').nodes();
        var bisect = d3_bisector<ParentNode, number>(function(node) { return -node.__data__.area(graph); }).left;

        function sortedByArea(this: any, entity: osmWay) {
            if (this._parent.__data__ === 'fill') {
                return fillpaths[bisect(fillpaths, -entity.area(graph))];
            }
            return undefined!;
        }

        paths.enter()
            .insert('path', sortedByArea)
            .merge(paths)
            .each(function(entity) {
                var layer = this.parentNode!.__data__;
                this.setAttribute('class', entity.type + ' area ' + layer + ' ' + entity.id);

                if (layer === 'fill') {
                    this.setAttribute('clip-path', 'url(#ideditor-' + entity.id + '-clippath)');
                    this.style.fill = getPatternStyle(entity.tags);
                    this.style.stroke = this.style.fill;
                }
            })
            .classed('added', function(d) {
                return !base.entities[d.id];
            })
            .classed('geometry-edited', function(d) {
                return !!graph.entities[d.id] &&
                    !!base.entities[d.id] &&
                    !deepEqual((graph.entities[d.id] as osmWay).nodes, (base.entities[d.id] as osmWay).nodes);
            })
            .classed('retagged', function(d) {
                return !!graph.entities[d.id] &&
                    !!base.entities[d.id] &&
                    !deepEqual(graph.entities[d.id]!.tags, base.entities[d.id]!.tags);
            })
            .call(svgTagClasses())
            .attr('d', path);


        // Draw touch targets..
        touchLayer
            .call(drawTargets, graph, data.stroke, filter);
    }

    return drawAreas;
}
