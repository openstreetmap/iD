import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';
import { t } from '../util/locale';

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

        var selected = service.getSelectedImage();
        var selectedImageKey = selected && selected.key;
        var imageKey;

        // Pick one of the images the map feature was detected in,
        // preference given to an image already selected.
        d.detections.forEach(function(detection) {
            if (!imageKey || selectedImageKey === detection.image_key) {
                imageKey = detection.image_key;
            }
        });

        service
            .selectImage(null, imageKey)
            .updateViewer(imageKey, context)
            .showViewer();
    }


    function update() {
        var service = getService();
        var data = (service ? service.mapFeatures(projection) : []);
        var viewer = d3_select('#photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();
        var selectedImageKey = selected && selected.key;
        var transform = svgPointTransform(projection);

        var mapFeatures = layer.selectAll('.icon-map-feature')
            .data(data, function(d) { return d.key; });

        // exit
        mapFeatures.exit()
            .remove();

        // enter
        var enter = mapFeatures.enter()
            .append('use')
            .attr('class', 'icon-map-feature')
            .attr('width', '24px')
            .attr('height', '24px')
            .attr('x', '-12px')
            .attr('y', '-12px')
            .attr('xlink:href', function(d) { return '#' + d.value; })
            .attr('title', function(d) {
                var id = d.value.replace(/--/g, '.').replace(/-/g, '_');
                return t('mapillary_map_features.' + id);
            })
            .classed('currentView', function(d) {
                return d.detections.some(function(detection) {
                    return detection.image_key === selectedImageKey;
                });
            })
            .on('click', click);

        // update
        mapFeatures
            .merge(enter)
            .sort(function(a, b) {
                return (a === selected) ? 1
                    : (b === selected) ? -1
                    : b.loc[1] - a.loc[1];  // sort Y
            })
            .attr('transform', transform);
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
            .attr('class', 'layer-mapillary-map-features')
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
