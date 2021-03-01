import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';


export function svgMapillarySigns(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    let layer = d3_select(null);
    let _mapillary;


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
        const service = getService();
        if (!service) return;

        service.loadSignResources(context);
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


    function click(d3_event, d) {
        const service = getService();
        if (!service) return;

        context.map().centerEase(d.loc);

        const selectedImageKey = service.getActiveImage() && service.getActiveImage().key;
        let imageKey;
        let highlightedDetection;

        d.detections.forEach(function(detection) {
            if (!imageKey || selectedImageKey === detection.image_key) {
                imageKey = detection.image_key;
                highlightedDetection = detection;
            }
        });

        if (imageKey === selectedImageKey) {
            service
                .highlightDetection(highlightedDetection)
                .selectImage(context, imageKey);
        } else {
            service.ensureViewerLoaded(context)
                .then(function() {
                    service
                        .highlightDetection(highlightedDetection)
                        .selectImage(context, imageKey)
                        .showViewer(context);
                });

        }
    }


    function filterData(detectedFeatures) {
        var fromDate = context.photos().fromDate();
        var toDate = context.photos().toDate();

        if (fromDate) {
            var fromTimestamp = new Date(fromDate).getTime();
            detectedFeatures = detectedFeatures.filter(function(feature) {
                return new Date(feature.last_seen_at).getTime() >= fromTimestamp;
            });
        }
        if (toDate) {
            var toTimestamp = new Date(toDate).getTime();
            detectedFeatures = detectedFeatures.filter(function(feature) {
                return new Date(feature.first_seen_at).getTime() <= toTimestamp;
            });
        }

        return detectedFeatures;
    }


    function update() {
        const service = getService();
        let data = (service ? service.signs(projection) : []);
        data = filterData(data);

        const selectedImageKey = service.getActiveImage() && service.getActiveImage().key;
        const transform = svgPointTransform(projection);

        const signs = layer.selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        // exit
        signs.exit()
            .remove();

        // enter
        const enter = signs.enter()
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
                const aSelected = a.detections.some(function(detection) {
                    return detection.image_key === selectedImageKey;
                });
                const bSelected = b.detections.some(function(detection) {
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
        const enabled = svgMapillarySigns.enabled;
        const service = getService();

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
                service.showSignDetections(true);
            } else {
                editOff();
            }
        } else if (service) {
            service.showSignDetections(false);
        }
    }


    drawSigns.enabled = function(_) {
        if (!arguments.length) return svgMapillarySigns.enabled;
        svgMapillarySigns.enabled = _;
        if (svgMapillarySigns.enabled) {
            showLayer();
            context.photos().on('change.mapillary_signs', update);
        } else {
            hideLayer();
            context.photos().on('change.mapillary_signs', null);
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
