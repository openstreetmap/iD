import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';
import { t } from '../core/localizer';

export function svgMapillaryMapFeatures(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    let layer = d3_select(null);
    let _mapillary;


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
        const service = getService();
        if (!service) return;

        service.loadObjectResources(context);
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


    function click(d3_event, d) {
        const service = getService();
        if (!service) return;

        context.map().centerEase(d.loc);

        const selectedImageId = service.getActiveImage() && service.getActiveImage().id;

        service.getDetections(d.id).then(detections => {
            if (detections.length) {
                const imageId = detections[0].image.id;
                if (imageId === selectedImageId) {
                    service
                        .highlightDetection(detections[0])
                        .selectImage(context, imageId);
                } else {
                    service.ensureViewerLoaded(context)
                        .then(function() {
                            service
                                .highlightDetection(detections[0])
                                .selectImage(context, imageId)
                                .showViewer(context);
                        });
                }
            }
        });
    }


    function filterData(detectedFeatures) {
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();

        if (fromDate) {
            detectedFeatures = detectedFeatures.filter(function(feature) {
                return new Date(feature.last_seen_at).getTime() >= new Date(fromDate).getTime();
            });
        }
        if (toDate) {
            detectedFeatures = detectedFeatures.filter(function(feature) {
                return new Date(feature.first_seen_at).getTime() <= new Date(toDate).getTime();
            });
        }

        return detectedFeatures;
    }


    function update() {
        const service = getService();
        let data = (service ? service.mapFeatures(projection) : []);
        data = filterData(data);

        const transform = svgPointTransform(projection);

        const mapFeatures = layer.selectAll('.icon-map-feature')
            .data(data, function(d) { return d.id; });

        // exit
        mapFeatures.exit()
            .remove();

        // enter
        const enter = mapFeatures.enter()
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
            .attr('transform', transform);
    }


    function drawMapFeatures(selection) {
        const enabled = svgMapillaryMapFeatures.enabled;
        const service = getService();

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
                service.showFeatureDetections(true);
            } else {
                editOff();
            }
        } else if (service) {
            service.showFeatureDetections(false);
        }
    }


    drawMapFeatures.enabled = function(_) {
        if (!arguments.length) return svgMapillaryMapFeatures.enabled;
        svgMapillaryMapFeatures.enabled = _;
        if (svgMapillaryMapFeatures.enabled) {
            showLayer();
            context.photos().on('change.mapillary_map_features', update);
        } else {
            hideLayer();
            context.photos().on('change.mapillary_map_features', null);
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
