import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { services } from '../services';


export function svgMapilioImages(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    let layer = d3_select(null);
    let _mapilio;


    function init() {
        if (svgMapilioImages.initialized) return;
        svgMapilioImages.enabled = false;
        svgMapilioImages.initialized = true;
    }


    function getService() {
        if (services.mapilio && !_mapilio) {
            _mapilio = services.mapilio;
            _mapilio.event.on('loadedImages', throttledRedraw);
        } else if (!services.mapilio && _mapilio) {
            _mapilio = null;
        }

        return _mapilio;
    }


    function showLayer() {
        const service = getService();
        if (!service) return;

        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }


    function hideLayer() {
        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', editOff);
    }


    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }


    function drawImages(selection) {
        const enabled = svgMapilioImages.enabled;
        const service = getService();

        layer = selection.selectAll('.layer-mapilio')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-mapilio')
            .style('display', enabled ? 'block' : 'none');

        layerEnter
            .append('g')
            .attr('class', 'sequences');

        layerEnter
            .append('g')
            .attr('class', 'markers');

        layer = layerEnter
            .merge(layer);

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                service.loadImages(projection);
            } else {
                editOff();
            }
        }
    }


    drawImages.enabled = function(_) {
        if (!arguments.length) return svgMapilioImages.enabled;
        svgMapilioImages.enabled = _;
        if (svgMapilioImages.enabled) {
            showLayer();
            context.photos().on('change.mapilio_images', null);
        } else {
            hideLayer();
            context.photos().on('change.mapilio_images', null);
        }
        dispatch.call('change');
        return this;
    };


    drawImages.supported = function() {
        return !!getService();
    };


    init();
    return drawImages;
}
