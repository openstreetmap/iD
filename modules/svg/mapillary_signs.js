import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';


export function svgMapillarySigns(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _mapillary;


    function init() {
        if (svgMapillarySigns.initialized) return;  // run once
        svgMapillarySigns.enabled = false;
        svgMapillarySigns.initialized = true;
    }


    function getService() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('loadedSigns', throttledRedraw);
        } else if (!services.mapillary && _mapillary) {
            _mapillary = null;
        }
        return _mapillary;
    }


    function showLayer() {
        var service = getService();
        if (!service) return;

        editOn();
    }


    function hideLayer() {
        throttledRedraw.cancel();
        editOff();
    }


    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.icon-sign').remove();
        layer.style('display', 'none');
    }


    function click(d) {
        var service = getService();
        if (!service) return;

        context.map().centerEase(d.loc);

        var selectedImageKey = service.getSelectedImageKey();
        var imageKey;

        // Pick one of the images the sign was detected in,
        // preference given to an image already selected.
        d.detections.forEach(function(detection) {
            if (!imageKey || selectedImageKey === detection.image_key) {
                imageKey = detection.image_key;
            }
        });

        service
            .selectImage(context, imageKey)
            .updateViewer(context, imageKey)
            .showViewer(context);
    }


    function update() {
        var service = getService();
        var data = (service ? service.signs(projection) : []);
        var selectedImageKey = service.getSelectedImageKey();
        var transform = svgPointTransform(projection);

        var signs = layer.selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        // exit
        signs.exit()
            .remove();

        // enter
        var enter = signs.enter()
            .append('g')
            .attr('class', 'icon-sign icon-detected')
            .on('click', click);

        enter
            .append('use')
            .attr('width', '24px')
            .attr('height', '24px')
            .attr('x', '-12px')
            .attr('y', '-12px')
            .attr('xlink:href', function(d) { return '#' + d.value; });

        enter
            .append('rect')
            .attr('width', '24px')
            .attr('height', '24px')
            .attr('x', '-12px')
            .attr('y', '-12px');

        // update
        signs
            .merge(enter)
            .attr('transform', transform)
            .classed('currentView', function(d) {
                return d.detections.some(function(detection) {
                    return detection.image_key === selectedImageKey;
                });
            })
            .sort(function(a, b) {
                var aSelected = a.detections.some(function(detection) {
                    return detection.image_key === selectedImageKey;
                });
                var bSelected = b.detections.some(function(detection) {
                    return detection.image_key === selectedImageKey;
                });
                if (aSelected === bSelected) {
                    return b.loc[1] - a.loc[1]; // sort Y
                } else if (aSelected) {
                    return 1;
                }
                return -1;
            });
    }


    function drawSigns(selection) {
        var enabled = svgMapillarySigns.enabled;
        var service = getService();

        layer = selection.selectAll('.layer-mapillary-signs')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-signs layer-mapillary-detections')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                service.loadSigns(projection);
            } else {
                editOff();
            }
        }
    }


    drawSigns.enabled = function(_) {
        if (!arguments.length) return svgMapillarySigns.enabled;
        svgMapillarySigns.enabled = _;
        if (svgMapillarySigns.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };


    drawSigns.supported = function() {
        return !!getService();
    };


    init();
    return drawSigns;
}
