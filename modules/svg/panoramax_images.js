import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { services } from '../services';
import {svgPath, svgPointTransform} from './helpers';


export function svgPanoramaxImages(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const imageMinZoom = 15;
    const lineMinZoom = 10;
    const viewFieldZoomLevel = 18;
    let layer = d3_select(null);
    let _panoramax;
    let _viewerYaw = 0;
    let _selectedSequence;
    let _activeUsernameFilter;
    let _activeIds;

    function init() {
        if (svgPanoramaxImages.initialized) return;
        svgPanoramaxImages.enabled = false;
        svgPanoramaxImages.initialized = true;
    }


    function getService() {
        if (services.panoramax && !_panoramax) {
            _panoramax = services.panoramax;
            _panoramax.event
                .on('viewerChanged', viewerChanged)
                .on('loadedLines', throttledRedraw)
                .on('loadedImages', throttledRedraw);
        } else if (!services.panoramax && _panoramax) {
            _panoramax = null;
        }

        return _panoramax;
    }

    async function filterImages(images) {
        const showsPano = context.photos().showsPanoramic();
        const showsFlat = context.photos().showsFlat();
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const username = context.photos().usernames();

        const service = getService();

        if (!showsPano || !showsFlat) {
            images = images.filter(function(image) {
                if (image.isPano) return showsPano;
                return showsFlat;
            });
        }
        if (fromDate) {
            images = images.filter(function(image) {
                return new Date(image.capture_time).getTime() >= new Date(fromDate).getTime();
            });
        }
        if (toDate) {
            images = images.filter(function(image) {
                return new Date(image.capture_time).getTime() <= new Date(toDate).getTime();
            });
        }
        if (username && service) {
            if (_activeUsernameFilter !== username) {
                _activeUsernameFilter = username;

                const tempIds = await service.getUserIds(username);

                _activeIds = {};
                tempIds.forEach(id => {
                    _activeIds[id] = true;
                });
            }

            images = images.filter(function(image) {
                return _activeIds[image.account_id];
            });
        }

        return images;
    }

    async function filterSequences(sequences) {
        const showsPano = context.photos().showsPanoramic();
        const showsFlat = context.photos().showsFlat();
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const username = context.photos().usernames();

        const service = getService();

        if (!showsPano || !showsFlat) {
            sequences = sequences.filter(function(sequence) {
                    if (sequence.properties.type === 'equirectangular') return showsPano;
                    return showsFlat;
            });
        }
        if (fromDate) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.date).getTime() >= new Date(fromDate).getTime().toString();
            });
        }
        if (toDate) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.date).getTime() <= new Date(toDate).getTime().toString();
            });
        }
        if (username && service) {
            if (_activeUsernameFilter !== username) {
                _activeUsernameFilter = username;

                const tempIds = await service.getUserIds(username);

                _activeIds = {};
                tempIds.forEach(id => {
                    _activeIds[id] = true;
                });
            }

            sequences = sequences.filter(function(sequence) {
                return _activeIds[sequence.properties.account_id];
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
        let rot = d.heading;
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

        if (image.sequence_id !== _selectedSequence) {
            _viewerYaw = 0;  // reset
        }

        _selectedSequence = image.sequence_id;

        service
            .ensureViewerLoaded(context)
            .then(function() {
                service
                    .selectImage(context, image.id)
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

        images = await filterImages(images);
        sequences = await filterSequences(sequences, service);

        let traces = layer.selectAll('.sequences').selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.id; });

        // exit
        traces.exit()
            .remove();

        traces.enter()
            .append('path')
            .attr('class', 'sequence')
            .merge(traces)
            .attr('d', svgPath(projection).geojson);


        const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
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

        const activeImageId = service.getActiveImage()?.id;
        // update
        const markers = groups
            .merge(groupsEnter)
            .sort(function(a, b) {
                // active image on top
                if (a.id === activeImageId) return  1;
                if (b.id === activeImageId) return -1;
                // else: sort by capture time (newest on top)
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

        service.setStyles(context, null);

        function viewfieldPath() {
            if (this.parentNode.__data__.isPano) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }
    }

    function viewerChanged() {
        const service = getService();
        if (!service) return;

        const frame = service.photoFrame();
        if (!frame) return;

        // update viewfield rotation
        _viewerYaw = frame.getYaw();

        // avoid updating if the map is currently transformed
        // e.g. during drags or easing.
        if (context.map().isTransformed()) return;

        layer.selectAll('.viewfield-group.currentView')
            .attr('transform', d => transform(d, d.id));
    }


    function drawImages(selection) {

        const enabled = svgPanoramaxImages.enabled;
        const service = getService();

        layer = selection.selectAll('.layer-panoramax')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-panoramax')
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
            let zoom = ~~context.map().zoom();
            if (service){
                if (zoom >= imageMinZoom) {
                    editOn();
                    update();
                    service.loadImages(projection);
                } else if (zoom >= lineMinZoom) {
                    editOn();
                    update();
                    service.loadLines(projection, zoom);
                } else {
                    editOff();
                }
            } else {
                editOff();
            }
        }
    }

    drawImages.enabled = function(_) {
        if (!arguments.length) return svgPanoramaxImages.enabled;
        svgPanoramaxImages.enabled = _;
        if (svgPanoramaxImages.enabled) {
            showLayer();
            context.photos().on('change.panoramax_images', update);
        } else {
            hideLayer();
            context.photos().on('change.panoramax_images', null);
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
