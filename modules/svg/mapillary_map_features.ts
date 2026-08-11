import { throttle } from 'es-toolkit';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';
import { t } from '../core/localizer';
import type { Projection } from '../geo/raw_mercator';
import type { Dispatch } from 'd3';
import type { MlyImage } from '../services/mapillary';
import type { coreContext } from '../core';

export function svgMapillaryMapFeatures(projection: Projection, context: coreContext, dispatch: Dispatch<object>) {
    const throttledRedraw = throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    let layer: d3.Selection<SVGGElement> = d3_select(null!);
    let _mapillary: typeof services.mapillary | null;


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


    function click(d3_event: MouseEvent, d: MlyImage) {
        const service = getService();
        if (!service) return;

        context.map().centerEase(d.loc);

        const selectedImage = service.getActiveImage();

        service.getDetections(d.id).then(detections => {
            if (detections.length) {
                const { image } = detections[0];
                if (selectedImage && image.id === selectedImage.id) {
                    service
                        .highlightDetection(detections[0])
                        .selectImage(image);
                } else {
                    service.ensureViewerLoaded(context)
                        .then(function() {
                            service
                                .highlightDetection(detections[0])
                                .selectImage(image)
                                .showViewer(context);
                        });
                }
            }
        });
    }


    function filterData(detectedFeatures: MlyImage[]) {
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();

        if (fromDate) {
            detectedFeatures = detectedFeatures.filter(function(feature) {
                return new Date(feature.last_seen_at!).getTime() >= new Date(fromDate).getTime();
            });
        }
        if (toDate) {
            detectedFeatures = detectedFeatures.filter(function(feature) {
                return new Date(feature.first_seen_at!).getTime() <= new Date(toDate).getTime();
            });
        }

        return detectedFeatures;
    }


    function update() {
        const service = getService();
        let data = (service ? service.mapFeatures(projection) : []);
        data = filterData(data);

        const transform = svgPointTransform(projection);

        const mapFeatures = layer.selectAll<SVGGElement, MlyImage>('.icon-map-feature')
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
                var id = d.value!.replace(/--/g, '.').replace(/-/g, '_');
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


    function drawMapFeatures(selection: d3.Selection<SVGGElement>) {
        const enabled = svgMapillaryMapFeatures.enabled;
        const service = getService();

        layer = selection.selectAll<SVGGElement, 0>('.layer-mapillary-map-features')
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


    drawMapFeatures.enabled = function(_: boolean) {
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

    drawMapFeatures.rendered = function(zoom: number) {
      return zoom >= minZoom;
    };


    init();
    return drawMapFeatures;
}
svgMapillaryMapFeatures.enabled = false;
svgMapillaryMapFeatures.initialized = false;
