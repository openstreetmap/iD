import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { services } from '../services';
import {svgPath, svgPointTransform} from './helpers';


export function svgMapilioImages(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const imageMinZoom = 16;
    const lineMinZoom = 10;
    const viewFieldZoomLevel = 18;
    let layer = d3_select(null);
    let _mapilio;
    let _viewerYaw = 0;

    function init() {
        if (svgMapilioImages.initialized) return;
        svgMapilioImages.enabled = false;
        svgMapilioImages.initialized = true;
    }

    function getService() {
        if (services.mapilio && !_mapilio) {
            _mapilio = services.mapilio;
            _mapilio.event
                .on('loadedImages', throttledRedraw)
                .on('loadedLines', throttledRedraw);
        } else if (!services.mapilio && _mapilio) {
            _mapilio = null;
        }

        return _mapilio;
    }

    /**
     * Filters images
     * @param {*} images
     * @param {Boolean} skipDateFilter if true, the set date filters will be ignored
     * @returns array of filtered images
     */
    function filterImages(images, skipDateFilter = false) {
        var fromDate = context.photos().fromDate();
        var toDate = context.photos().toDate();

        if (fromDate && !skipDateFilter) {
            images = images.filter(function(image) {
                return new Date(image.capture_time).getTime() >= new Date(fromDate).getTime();
            });
        }
        if (toDate && !skipDateFilter) {
            images = images.filter(function(image) {
                return new Date(image.capture_time).getTime() <= new Date(toDate).getTime();
            });
        }

        return images;
    }

    /**
     * Filters sequences
     * @param {*} sequences
     * @param {Boolean} skipDateFilter if true, the set date filters will be ignored
     * @returns array of filtered sequences
     */
    function filterSequences(sequences, skipDateFilter = false) {
        var fromDate = context.photos().fromDate();
        var toDate = context.photos().toDate();

        if (fromDate && !skipDateFilter) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.capture_time).getTime() >= new Date(fromDate).getTime().toString();
            });
        }
        if (toDate && !skipDateFilter) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.capture_time).getTime() <= new Date(toDate).getTime().toString();
            });
        }

        return sequences;
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

    function transform(d, selectedImageId) {
        let t = svgPointTransform(projection)(d);
        let rot = d.heading || 0;

        if (d.id === selectedImageId) {
            rot += _viewerYaw;
        }
        if (rot) {
            t += ' rotate(' + Math.floor(rot) + ',0,0)';
        }
        return t;
    }


    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }

    function click(d3_event, image) {
        const service = getService();
        if (!service) return;

        service.ensureViewerLoaded(context, image.id)
            .then(() => {
                service.selectImage(context, image.id)
                    .showViewer(context);
            });

        context.map().centerEase(image.loc);
    }

    function mouseover(d3_event, image) {
        const service = getService();
        if (service) service.setStyles(context, image);
    }


    function mouseout() {
        const service = getService();
        if (service) service.setStyles(context, null);
    }

    async function update() {
        const zoom = ~~context.map().zoom();
        const showViewfields = (zoom >= viewFieldZoomLevel);
        const service = getService();

        let sequences = (service ? service.sequences(projection, zoom) : []);
        let images = (service && zoom >= imageMinZoom ? service.images(projection) : []);

        dispatch.call('photoDatesChanged', this, 'mapilio', [
            ...filterImages(images, true).map(p => p.capture_time),
            ...filterSequences(sequences, true).map(s => s.properties.capture_time)
        ]);

        images = await filterImages(images);
        sequences = await filterSequences(sequences, service);

        const activeImage = service.getActiveImage?.();
        const activeImageId = activeImage ? activeImage.id : null;

        let traces = layer
            .selectAll('.sequences')
            .selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.id; });

        // exit
        traces.exit().remove();

        traces.enter()
            .append('path')
            .attr('class', 'sequence')
            .merge(traces)
            .attr('d', svgPath(projection).geojson);

        const groups = layer
            .selectAll('.markers')
            .selectAll('.viewfield-group')
            .data(images, function(d) { return d.id; });

        // exit
        groups.exit().remove();

        // enter
        const groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .on('mouseenter', mouseover)
            .on('mouseleave', mouseout)
            .on('click', click);

        groupsEnter
            .append('g')
            .attr('class', 'viewfield-scale');

        // update
        const markers = groups
            .merge(groupsEnter)
            .sort(function(a, b) {
                if (a.id === activeImageId) return 1;
                if (b.id === activeImageId) return -1;
                return a.capture_time_parsed - b.capture_time_parsed;
            })
            .attr('transform', d => transform(d, activeImageId))
            .select('.viewfield-scale');


        markers.selectAll('circle')
            .data([0])
            .enter()
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '6');

        const viewfields = markers.selectAll('.viewfield')
            .data(showViewfields ? [0] : []);

        viewfields.exit().remove();

        viewfields.enter()
            .insert('path', 'circle')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', viewfieldPath);

        service.setStyles(context, null);

        function viewfieldPath() {
            if (this.parentNode.__data__.isPano) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }

    }

    function drawImages(selection) {
        const enabled = svgMapilioImages.enabled;
        const service = getService();

        layer = selection.selectAll('.layer-mapilio')
            .data(service ? [0] : []);

        layer.exit().remove();

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

        layer = layerEnter.merge(layer);

        if (enabled) {
            let zoom = ~~context.map().zoom();
            if (service) {
                if (zoom >= imageMinZoom) {
                    editOn();
                    update();
                    service.loadImages(projection);
                    service.loadLines(projection, zoom);
                } else if (zoom >= lineMinZoom) {
                    editOn();
                    update();
                    service.loadImages(projection);
                    service.loadLines(projection, zoom);
                } else {
                    editOff();
                    dispatch.call('photoDatesChanged', this, 'mapilio', []);
                    service.selectImage(context, null);
                }
            } else {
                editOff();
            }
        } else {
            dispatch.call('photoDatesChanged', this, 'mapilio', []);
        }
    }

    drawImages.enabled = function(_) {
        if (!arguments.length) return svgMapilioImages.enabled;
        svgMapilioImages.enabled = _;
        if (svgMapilioImages.enabled) {
            showLayer();
            context.photos().on('change.mapilio_images', update);
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

    drawImages.rendered = function(zoom) {
      return zoom >= lineMinZoom;
    };


    init();
    return drawImages;
}
