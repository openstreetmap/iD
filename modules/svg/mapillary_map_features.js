import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';
import { t } from '../core/localizer';

export function svgMapillaryMapFeatures(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _mapillary;


    function init() {
        if (svgMapillaryMapFeatures.initialized) return;  // run once
        svgMapillaryMapFeatures.enabled = false;
        svgMapillaryMapFeatures.initialized = true;
    }


    function getService() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('loadedMapFeatures', throttledRedraw);
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
        layer.selectAll('.icon-map-feature').remove();
        layer.style('display', 'none');
    }


    function click(d) {
        var service = getService();
        if (!service) return;

        context.map().centerEase(d.loc);

        var selectedImageKey = service.getSelectedImageKey();
        var imageKey;

        // Pick one of the images the map feature was detected in,
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
        var data = (service ? service.mapFeatures(projection) : []);
        var selectedImageKey = service && service.getSelectedImageKey();
        var transform = svgPointTransform(projection);

        var mapFeatures = layer.selectAll('.icon-map-feature')
            .data(data, function(d) { return d.key; });

        // exit
        mapFeatures.exit()
            .remove();

        // enter
        var enter = mapFeatures.enter()
            .append('g')
            .attr('class', 'icon-map-feature icon-detected')
            .on('click', click);

        enter
            .append('title')
            .text(function(d) {
                var id = d.value.replace(/--/g, '.').replace(/-/g, '_');
                return t('mapillary_map_features.' + id);
            });

        enter
            .append('use')
            .attr('width', '24px')
            .attr('height', '24px')
            .attr('x', '-12px')
            .attr('y', '-12px')
            .attr('xlink:href', function(d) {
                if (d.value === 'object--billboard') {
                    // no billboard icon right now, so use the advertisement icon
                    return '#object--sign--advertisement';
                }
                return '#' + d.value;
            });

        enter
            .append('rect')
            .attr('width', '24px')
            .attr('height', '24px')
            .attr('x', '-12px')
            .attr('y', '-12px');

        // update
        mapFeatures
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


    function drawMapFeatures(selection) {
        var enabled = svgMapillaryMapFeatures.enabled;
        var service = getService();

        layer = selection.selectAll('.layer-mapillary-map-features')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-map-features layer-mapillary-detections')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                service.loadMapFeatures(projection);
            } else {
                editOff();
            }
        }
    }


    drawMapFeatures.enabled = function(_) {
        if (!arguments.length) return svgMapillaryMapFeatures.enabled;
        svgMapillaryMapFeatures.enabled = _;
        if (svgMapillaryMapFeatures.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };


    drawMapFeatures.supported = function() {
        return !!getService();
    };


    init();
    return drawMapFeatures;
}
