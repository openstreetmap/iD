import { svgPointTransform } from "./helpers";

export function svgGeolocate(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _position;


    function init() {
        if (svgGeolocate.initialized) return;  // run once
        svgGeolocate.enabled = false;
        svgGeolocate.initialized = true;
    }

    function showLayer() {
        layer.attr('display', 'block'); 
        layerOn();
    }


    function hideLayer() {
        throttledRedraw.cancel();
        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', function() {});
    }

    function layerOn() {
        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });

    }

    function layerOff() {
        // layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }

    function transform(d) {
        return svgPointTransform(projection)(d);
    }
    
    function update() {
        var points = layer.selectAll('.geolocations').selectAll('.geolocation')
            .data([_position]);
    

        points.enter()
            .append('g')
            .attr('class', 'point')
            .attr('transform', transform);

    }

    function drawLocation(selection) {
        var enabled = svgGeolocate.enabled;

        layer = selection.selectAll('.layer-geolocate')
            .data([]);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-geolocation')
            .style('display', enabled ? 'block' : 'none');

        layerEnter
            .append('g')
            .attr('class', 'geolocations');

        layerEnter
            .append('g')
            .attr('class', 'radius');
        
        layer = layerEnter
            .merge(layer);

        if (enabled) {
            layerOn();
            update();
        } else {
            layerOff();
        }
    }

    drawLocation.enabled = function(_) {
        if (!arguments.length) return svgGeolocate.enabled;
        _position = _;
        svgGeolocate.enabled = true;
        if (svgGeolocate.enabled) {
            showLayer();
            update();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };



    init();
    return drawLocation;
}
