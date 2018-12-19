import { select as d3_select } from 'd3-selection';

import { svgPointTransform } from './helpers';
import { geoMetersToLat } from '../geo';
import _throttle from 'lodash-es/throttle';

export function svgGeolocate(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var layer = d3_select(null);
    var _position;


    function init() {
        if (svgGeolocate.initialized) return;  // run once
        svgGeolocate.enabled = false;
        svgGeolocate.initialized = true;
    }

    function showLayer() {
        layer.style('display', 'block');
    }


    function hideLayer() {
        throttledRedraw.cancel();
        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', function () { });
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

    function transform(d) {
        return svgPointTransform(projection)(d);
    }

    function accuracy(accuracy, loc) { // converts accuracy to pixels...
        var degreesRadius = geoMetersToLat(accuracy),
            tangentLoc = [loc[0], loc[1] + degreesRadius],
            projectedTangent = projection(tangentLoc),
            projectedLoc = projection([loc[0], loc[1]]);

       return Math.round(projectedLoc[1] - projectedTangent[1]).toString(); // more south point will have higher pixel value...
    }

    function update() {
        var geolocation = { loc: [_position.coords.longitude, _position.coords.latitude] };

        var groups = layer.selectAll('.geolocations').selectAll('.geolocation')
            .data([geolocation]);

        groups.exit()
            .remove();

        var pointsEnter = groups.enter()
            .append('g')
            .attr('class', 'geolocation');

        pointsEnter
            .append('circle')
            .attr('id', 'geolocate-radius')
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

        d3_select('#geolocate-radius').attr('r', accuracy(_position.coords.accuracy, geolocation.loc));
    }

    function drawLocation(selection) {
        var enabled = svgGeolocate.enabled;

        layer = selection.selectAll('.layer-geolocate')
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

    drawLocation.enabled = function (position, enabled) {
        if (!arguments.length) return svgGeolocate.enabled;
        _position = position;
        svgGeolocate.enabled = enabled;
        if (svgGeolocate.enabled) {
            showLayer();
            layerOn();
        } else {
            hideLayer();
        }
        // dispatch.call('change');
        return this;
    };

    init();
    return drawLocation;
}
