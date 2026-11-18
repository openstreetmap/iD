import { deepEqual } from 'fast-equals';
import { bisector as d3_bisector } from 'd3-array';

import { osmIdManager, type EntityId, type OsmEntity, type osmRelation, type osmWay } from '../osm';
import { svgPath, svgSegmentWay, type SegmentFeature } from './helpers';
import { svgTagClasses } from './tag_classes';
import { svgTagPattern } from './tag_pattern';
import type { Projection } from '../geo/raw_mercator';
import type { coreContext, coreGraph } from '../core';
import type { OsmLayer } from './osm';
import type { TouchLayer } from './touch';

type Area = osmWay | osmRelation;

type AreaGroup = 'fill' | 'shadow' | 'stroke';

export function svgAreas(projection: Projection, context: coreContext) {


    function getPatternStyle(tags: Tags) {
        var imageID = svgTagPattern(tags);
        if (imageID) {
            return 'url("#ideditor-' + imageID + '")';
        }
        return '';
    }


    function drawTargets(selection: d3.Selection<SVGGElement>, graph: coreGraph, entities: osmWay[], filter: (way: osmWay) => boolean) {
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
                !deepEqual(graph.entity(wayID).nodes, base.entity(wayID).nodes)) {
                return false;
            }
            return d.properties.nodes.some(function(n) {
                return !base.entities[n.id] ||
                       !deepEqual(graph.entity(n.id).loc, base.entity(n.id).loc);
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


    function drawAreas(selection: d3.Selection<SVGSVGElement>, graph: coreGraph, entities: OsmEntity[], filter: (area: Area) => boolean) {
        var path = svgPath(projection, graph, true);
        var areas: Record<EntityId, { entity: Area; area: number }> = {};
        var base = context.history().base();

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.type === 'node') continue;
            if (entity.geometry(graph) !== 'area') continue;
            if (!areas[entity.id]) {
                areas[entity.id] = {
                    entity: entity,
                    area: Math.abs(entity.area(graph))
                };
            }
        }

        var fills = Object
            .values(areas)
            .filter(function hasPath(a) { return path(a.entity); })
            .sort(function areaSort(a, b) { return b.area - a.area; })
            .map(function(a) { return a.entity; });

        var strokes = fills.filter((area): area is osmWay => area.type === 'way');

        var data = {
            clip: fills,
            shadow: strokes,
            stroke: strokes,
            fill: fills
        };

        var clipPaths = context.surface().selectAll('defs').selectAll<SVGClipPathElement, Area>('.clipPath-osm')
           .filter(filter)
           .data<Area>(data.clip, osmIdManager.key);

        clipPaths.exit()
           .remove();

        var clipPathsEnter = clipPaths.enter()
           .append('clipPath')
           .attr('class', 'clipPath-osm')
           .attr('id', function(entity) { return 'ideditor-' + entity.id + '-clippath'; });

        clipPathsEnter
           .append('path');

        clipPaths.merge(clipPathsEnter)
           .selectAll<SVGPathElement, Area>('path')
           .attr('d', path);


        const drawLayer = selection.selectAll<SVGGElement, OsmLayer>('.layer-osm.areas');
        const touchLayer = selection.selectAll<SVGGElement, TouchLayer>('.layer-touch.areas');

        // Draw areas..
        var areagroup = drawLayer
            .selectAll<SVGGElement, AreaGroup>('g.areagroup')
            .data<AreaGroup>(['fill', 'shadow', 'stroke']);

        areagroup = areagroup.enter()
            .append('g')
            .attr('class', function(d) { return 'areagroup area-' + d; })
            .merge(areagroup);

        var paths = areagroup
            .selectAll<SVGPathElement, Area>('path')
            .filter(filter)
            .data<Area>(function(layer) { return data[layer]; }, osmIdManager.key);

        paths.exit()
            .remove();


        var fillpaths = selection.selectAll<SVGPathElement, Area>('.area-fill path.area').nodes();
        var bisect = d3_bisector<SVGPathElement, number>(function(node) { return -node.__data__.area(graph); }).left;

        function sortedByArea(this: any, entity: Area) {
            if (this._parent.__data__ === 'fill') {
                return fillpaths[bisect(fillpaths, -entity.area(graph))];
            }
            return null;
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
                    d.type === 'way' &&
                    !deepEqual(graph.entity(d.id).nodes, base.entity(d.id).nodes);
            })
            .classed('retagged', function(d) {
                return !!graph.entities[d.id] &&
                    !!base.entities[d.id] &&
                    !deepEqual(graph.entity(d.id).tags, base.entity(d.id).tags);
            })
            .call(svgTagClasses())
            .attr('d', path);


        // Draw touch targets..
        touchLayer
            .call(drawTargets, graph, data.stroke, filter);
    }

    return drawAreas;
}

export interface svgAreas extends ReturnType<typeof svgAreas> {}
