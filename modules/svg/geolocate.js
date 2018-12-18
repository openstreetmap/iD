
export function svgGeolocate(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _mapillary;


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
    
    function update(location) {

        var groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data([location]);

    }

    function drawLocation(selection) {
        var enabled = svgGeolocate.enabled;

        layer = selection.selectAll('.layer-mapillary-signs')
            .data([]);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-geolocate-point')
            .style('display', enabled ? 'block' : 'none')
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
        svgGeolocate.enabled = _;
        if (svgGeolocate.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };



    init();
    return drawLocation;
}
