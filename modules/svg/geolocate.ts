import { select as d3_select } from 'd3-selection';

import { svgPointTransform } from './helpers';
import { geoMetersToLat } from '../geo';
import type { Projection } from '../geo/raw_mercator';
import type { osmNode } from '../osm';
import type { Vec2 } from '../geo/vector';
import type { SvgLayer } from './layers';


export type WithLoc = Pick<osmNode, 'loc'>;

export function svgGeolocate(projection: Projection): SvgLayer {
    var layer: d3.Selection<SVGGElement> = d3_select(null!);
    var _position: GeolocationPosition;


    function init() {
        if (svgGeolocate.initialized) return;  // run once
        svgGeolocate.enabled = false;
        svgGeolocate.initialized = true;
    }

    function showLayer() {
        layer.style('display', 'block');
    }


    function hideLayer() {
        layer
            .transition()
            .duration(250)
            .style('opacity', 0);
    }

    function layerOn() {
        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1);

    }

    function layerOff() {
        layer.style('display', 'none');
    }

    function transform(d: WithLoc) {
        return svgPointTransform(projection)(d);
    }

    function accuracy(accuracy: number, loc: Vec2) { // converts accuracy to pixels...
        var degreesRadius = geoMetersToLat(accuracy),
            tangentLoc: Vec2 = [loc[0], loc[1] + degreesRadius],
            projectedTangent = projection(tangentLoc),
            projectedLoc = projection([loc[0], loc[1]]);

        // southern most point will have higher pixel value...
       return Math.round(projectedLoc[1] - projectedTangent[1]).toString();
    }

    function update() {
        var geolocation: WithLoc = { loc: [_position.coords.longitude, _position.coords.latitude] };

        var groups = layer.selectAll('.geolocations').selectAll<SVGGElement, WithLoc>('.geolocation')
            .data([geolocation]);

        groups.exit()
            .remove();

        var pointsEnter = groups.enter()
            .append('g')
            .attr('class', 'geolocation');

        pointsEnter
            .append('circle')
            .attr('class', 'geolocate-radius')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('fill', 'rgb(15,128,225)')
            .attr('fill-opacity', '0.3')
            .attr('r', '0');

        pointsEnter
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('fill', 'rgb(15,128,225)')
            .attr('stroke', 'white')
            .attr('stroke-width', '1.5')
            .attr('r', '6');

        groups.merge(pointsEnter)
            .attr('transform', transform);

        layer.select('.geolocate-radius').attr('r', accuracy(_position.coords.accuracy, geolocation.loc));
    }

    function drawLocation(selection: d3.Selection<SVGGElement>) {
        var enabled = svgGeolocate.enabled;

        layer = selection.selectAll<SVGGElement, 0>('.layer-geolocate')
            .data([0]);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-geolocate')
            .style('display', enabled ? 'block' : 'none');

        layerEnter
            .append('g')
            .attr('class', 'geolocations');

        layer = layerEnter
            .merge(layer);

        if (enabled) {
            update();
        } else {
            layerOff();
        }
    }

    drawLocation.enabled = function (position: GeolocationPosition, enabled: boolean) {
        if (!arguments.length) return svgGeolocate.enabled;
        _position = position;
        svgGeolocate.enabled = enabled;
        if (svgGeolocate.enabled) {
            showLayer();
            layerOn();
        } else {
            hideLayer();
        }
        return this;
    };

    init();
    return drawLocation;
}
svgGeolocate.enabled = false;
svgGeolocate.initialized = false;
