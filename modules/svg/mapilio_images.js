import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { services } from '../services';
import {svgPath, svgPointTransform} from './helpers';


export function svgMapilioImages(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const imageMinZoom = 16;
    const lineMinZoom = 12;
    const viewFieldZoomLevel = 18;
    let layer = d3_select(null);
    let _mapilio;
    let _viewerYaw = 0;
    // let _activeUsernameFilter;
    // let _activeIds;

    function init() {
        if (svgMapilioImages.initialized) return;
        svgMapilioImages.enabled = true;
        svgMapilioImages.initialized = true;
    }


    function getService() {
        if (services.mapilio && !_mapilio) {
            _mapilio = services.mapilio;
            _mapilio.event
                // .on('viewerChanged', viewerChanged)
                .on('loadedImages', throttledRedraw)
                .on('loadedLines', throttledRedraw);
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

        service.ensureViewerLoaded(context)
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

    /**
     * Filters images
     * @param {*} images
     * @returns array of filtered images
     */
    function filterImages(images) {
        var fromDate = context.photos().fromDate();
        var toDate = context.photos().toDate();
        // const username = context.photos().usernames();

        // const service = getService();

        if (fromDate) {
            images = images.filter(function(photo) {
                return new Date(photo.capture_time).getTime() >= new Date(fromDate).getTime();
            });
        }
        if (toDate) {
            images = images.filter(function(photo) {
                return new Date(photo.capture_time).getTime() <= new Date(toDate).getTime();
            });
        }
        // if (username && service) {
        //     if (_activeUsernameFilter !== username) {
        //         _activeUsernameFilter = username;

        //         const tempIds = await service.getUserIds(username);

        //         _activeIds = {};
        //         tempIds.forEach(id => _activeIds[id] = true);
        //     }
        //     images = images.filter(img => _activeIds[img.account_id]);
        // }

        return images;
    }

    /**
     * Filters sequences
     * @param {*} sequences
     * @returns array of filtered sequences
     */
    function filterSequences(sequences) {
        var fromDate = context.photos().fromDate();
        var toDate = context.photos().toDate();
        // const username = context.photos().usernames();

        // const service = getService();

        if (fromDate) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.capture_time).getTime() >= new Date(fromDate).getTime();
            });
        }
        if (toDate) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.capture_time).getTime() <= new Date(toDate).getTime();
            });
        }
        // if (username && service) {
        //     if (_activeUsernameFilter !== username) {
        //         _activeUsernameFilter = username;

        //         const tempIds = await service.getUserIds(username);
        //         _activeIds = {};
        //         tempIds.forEach(id => _activeIds[id] = true);
        //     }
        //     sequences = sequences.filter(seq => _activeIds[seq.properties.account_id]);
        // }

        return sequences;
    }

    function update() {
        const z = ~~context.map().zoom();
        const showViewfields = (z >= viewFieldZoomLevel);
        const service = getService();

        let sequences = (service ? service.sequences(projection) : []);
        let images = (service ? service.images(projection) : []);

        dispatch.call('photoDatesChanged', this, 'mapilio', [
            ...images.map(p => p.capture_time),
            ...sequences.map(s => s.properties.capture_time)
        ]);

        images = filterImages(images);
        sequences = filterSequences(sequences);

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
        groups.exit()
            .remove();

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


        const activeImage = service.getActiveImage?.();
        const activeImageId = activeImage ? activeImage.id : null;
        // update
        const markers = groups
            .merge(groupsEnter)
            .sort((a, b) => {
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

        viewfields.exit()
            .remove();

        viewfields.enter()
            .insert('path', 'circle')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            if (this.parentNode.__data__.isPano) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }

    }

    // function viewerChanged() {
    //     const service = getService();
    //     if (!service) return;

    //     const frame = service.photoFrame();
    //     if (!frame) return;

    //     // update viewfield rotation
    //     _viewerYaw = frame.getYaw();

    //     // avoid updating if the map is currently transformed
    //     // e.g. during drags or easing.
    //     if (context.map().isTransformed()) return;

    //     layer.selectAll('.viewfield-group.currentView')
    //         .attr('transform', d => transform(d, d.id));
    // }


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
                } else if (zoom >= lineMinZoom) {
                    editOn();
                    update();
                    service.loadLines(projection);
                } else {
                    editOff();
                    dispatch.call('photoDatesChanged', this, 'mapilio', []);
                    // Reset selected image and hide viewer when zoomed out
                    // service.selectImage(context, null);
                    service.hideViewer(context);
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
