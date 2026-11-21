import { deepEqual } from 'fast-equals';
import { clamp } from 'es-toolkit/compat';
import { select as d3_select } from 'd3';

import { geoScaleToZoom } from '../geo';
import { osmIdManager, type osmNode, type EntityId, type OsmEntity } from '../osm';
import { svgPointTransform } from './helpers';
import { svgTagClasses } from './tag_classes';
import { presetManager } from '../presets';
import { getRadiiInPixels, type coreContext, type coreGraph } from '../core';
import { textWidth, isAddressPoint } from './labels';
import type { Projection } from '../geo/raw_mercator';
import type { Feature, Point } from 'geojson';
import type { PointsGroup } from './osm';
import type { TouchLayer } from './touch';

type PointFeature = Feature<Point, {
    target: true;
    entity: osmNode;
    isAddr: boolean;
}>;

export function svgPoints(projection: Projection, context: coreContext) {
    var _currSelected = new Set<EntityId>();
    var _prevSelected = new Set<EntityId>();

    function markerPath(selection: d3.Selection<SVGPathElement>, klass: string) {
        selection
            .attr('class', klass)
            .attr('transform', d => isAddressPoint(d.tags)
                ? `translate(-${addressShieldWidth(d, selection)/2}, -8)`
                : 'translate(-8, -23)')
            .attr('d', d => {
                if (!isAddressPoint(d.tags)) {
                    return 'M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z';
                }
                const w = addressShieldWidth(d, selection);
                return `M ${w-3.5} 0 a 3.5 3.5 0 0 0 3.5 3.5 l 0 9 a 3.5 3.5 0 0 0 -3.5 3.5 l -${w-7} 0 a 3.5 3.5 0 0 0 -3.5 -3.5 l 0 -9 a 3.5 3.5 0 0 0 3.5 -3.5 z`;
            });
    }

    function sortY(a: osmNode, b: osmNode) {
        return b.loc[1] - a.loc[1];
    }

    function addressShieldWidth<T extends Element>(d: osmNode, selection: d3.Selection<T>) {
        const width = textWidth(d.tags['addr:housenumber'] || d.tags['addr:housename'] || '', 10, selection.node()!.parentElement!);
        return clamp(width, 10, 34) + 8;
    };

    // Avoid exit/enter if we're just moving stuff around.
    // The node will get a new version but we only need to run the update selection.
    function fastEntityKey(d: osmNode) {
        const mode = context.mode();
        const isMoving = mode && /^(add|draw|drag|move|rotate)/.test(mode.id);
        return isMoving ? d.id : osmIdManager.key(d);
    }


    function drawTargets(selection: d3.Selection<SVGGElement>, graph: coreGraph, entities: osmNode[], filter: (node: osmNode) => boolean) {
        var fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var getTransform = svgPointTransform(projection).geojson;
        var activeID = context.activeID();
        var data: PointFeature[] = [];

        entities.forEach(function(node) {
            if (activeID === node.id) return;   // draw no target on the activeID

            data.push({
                type: 'Feature',
                id: node.id,
                properties: {
                    target: true,
                    entity: node,
                    isAddr: isAddressPoint(node.tags)
                },
                geometry: node.asGeoJSON()
            });
        });

        var targets = selection.selectAll<SVGRectElement, PointFeature>('.point.target')
            .filter(d => filter(d.properties.entity))
            .data(data, d => fastEntityKey(d.properties.entity));

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('rect')
            .attr('x', d => d.properties.isAddr ? -addressShieldWidth(d.properties.entity, selection) / 2 : -10)
            .attr('y', d => d.properties.isAddr ? -8 : -26)
            .attr('width', d => d.properties.isAddr ? addressShieldWidth(d.properties.entity, selection) : 20)
            .attr('height', d => d.properties.isAddr ? 16 : 30)
            .attr('class', function(d) { return 'node point target ' + fillClass + d.id; })
            .merge(targets)
            .attr('transform', getTransform);
    }


    function drawPoints(selection: d3.Selection<SVGSVGElement>, graph: coreGraph, entities: OsmEntity[], filter: (node: osmNode) => boolean) {
        const selected = context.selectedIDs();
        var wireframe = context.surface().classed('fill-wireframe');
        var zoom = geoScaleToZoom(projection.scale());
        var base = context.history().base();

        // Points with a direction will render as vertices at higher zooms..
        function renderAsPoint(entity: OsmEntity): entity is osmNode {
            return entity.type === 'node' &&
                entity.geometry(graph) === 'point' &&
                !(zoom >= 18 && entity.directions(graph, projection).length);
        }

        // All points will render as vertices in wireframe mode too..
        var points = wireframe ? [] : entities.filter(renderAsPoint);
        points.sort(sortY);


        var drawLayer = selection.selectAll<SVGGElement, PointsGroup>('.layer-osm.points .points-group.points');
        var touchLayer = selection.selectAll<SVGGElement, TouchLayer>('.layer-touch.points');

        // Draw points..
        var groups = drawLayer.selectAll<SVGGElement, osmNode>('g.point')
            .filter(filter)
            .data(points, fastEntityKey);

        groups.exit()
            .remove();

        var enter = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'node point ' + d.id; })
            .order();

        enter
            .append('path')
            .call(markerPath, 'shadow');

        enter.each(function(d) {
            if (isAddressPoint(d.tags)) return;
            d3_select(this)
            .append('ellipse')
            .attr('cx', 0.5)
            .attr('cy', 1)
            .attr('rx', 6.5)
            .attr('ry', 3)
            .attr('class', 'stroke');
        });

        enter
            .append('path')
            .call(markerPath, 'stroke');

        enter
            .append('use')
            .attr('transform', 'translate(-5.5, -20)')
            .attr('class', 'icon')
            .attr('width', '12px')
            .attr('height', '12px');

        groups = groups
            .merge(enter)
            .attr('transform', svgPointTransform(projection))
            .classed('added', function(d) {
                return !base.entities[d.id]; // if it doesn't exist in the base graph, it's new
            })
            .classed('moved', function(d) {
                return !!base.entities[d.id] && !deepEqual(graph.entity(d.id).loc, base.entity(d.id).loc);
            })
            .classed('retagged', function(d) {
                return !!base.entities[d.id] && !deepEqual(graph.entity(d.id).tags, base.entity(d.id).tags);
            })
            .call(svgTagClasses());

        // Highlighted vertices with a radius/diameter get a circle
        const circles = groups
            .selectAll<SVGCircleElement, number>('.radius')
            .data((d) => selected.includes(d.id) ? getRadiiInPixels(d, projection) : []);

        circles.exit()
            .remove();

        circles.enter()
            .insert('circle', '.shadow')
            .attr('class', 'radius')
            .merge(circles)
            .attr('r', d => d);

        groups.select('.shadow');   // propagate bound data
        groups.select('.stroke');   // propagate bound data
        groups.select('.icon')      // propagate bound data
            .attr('xlink:href', function(entity) {
                var preset = presetManager.match(entity, graph);
                var picon = preset && preset.icon;
                return picon ? '#' + picon : '';
            });


        // Draw touch targets..
        touchLayer
            .call(drawTargets, graph, points, filter);
    }

    // partial redraw - only update the selected items..
    drawPoints.drawSelected = (selection: d3.Selection<SVGSVGElement>, graph: coreGraph) => {
        _prevSelected = _currSelected;
        _currSelected = new Set(context.selectedIDs());

        const ids = new Set([..._prevSelected, ..._currSelected]);
        const selectedEntities = [...ids]
            .map(id => graph.hasEntity(id))
            .filter(Boolean);

        drawPoints(selection, graph, selectedEntities, d => ids.has(d.id));
    };


    return drawPoints;
}

export interface svgPoints extends ReturnType<typeof svgPoints> {}
