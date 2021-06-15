import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
import { services } from '../services';


export function svgMapillaryImages(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    const minMarkerZoom = 16;
    const minViewfieldZoom = 18;
    let layer = d3_select(null);
    let _mapillary;


    function init() {
        if (svgMapillaryImages.initialized) return;  // run once
        svgMapillaryImages.enabled = false;
        svgMapillaryImages.initialized = true;
    }


    function getService() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('loadedImages', throttledRedraw);
        } else if (!services.mapillary && _mapillary) {
            _mapillary = null;
        }

        return _mapillary;
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


    function click(d3_event, image) {
        const service = getService();
        if (!service) return;

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


    function transform(d) {
        let t = svgPointTransform(projection)(d);
        if (d.ca) {
            t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        }
        return t;
    }


    function filterImages(images) {
        const showsPano = context.photos().showsPanoramic();
        const showsFlat = context.photos().showsFlat();
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();

        if (!showsPano || !showsFlat) {
            images = images.filter(function(image) {
                if (image.is_pano) return showsPano;
                return showsFlat;
            });
        }
        if (fromDate) {
            images = images.filter(function(image) {
                return new Date(image.captured_at).getTime() >= new Date(fromDate).getTime();
            });
        }
        if (toDate) {
            images = images.filter(function(image) {
                return new Date(image.captured_at).getTime() <= new Date(toDate).getTime();
            });
        }

        return images;
    }

    function filterSequences(sequences) {
        const showsPano = context.photos().showsPanoramic();
        const showsFlat = context.photos().showsFlat();
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();

        if (!showsPano || !showsFlat) {
            sequences = sequences.filter(function(sequence) {
                if (sequence.properties.hasOwnProperty('is_pano')) {
                    if (sequence.properties.is_pano) return showsPano;
                    return showsFlat;
                }
                return false;
            });
        }
        if (fromDate) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.captured_at).getTime() >= new Date(fromDate).getTime().toString();
            });
        }
        if (toDate) {
            sequences = sequences.filter(function(sequence) {
                return new Date(sequence.properties.captured_at).getTime() <= new Date(toDate).getTime().toString();
            });
        }

        return sequences;
    }

    function update() {

        const z = ~~context.map().zoom();
        const showMarkers = (z >= minMarkerZoom);
        const showViewfields = (z >= minViewfieldZoom);

        const service = getService();
        let sequences = (service ? service.sequences(projection) : []);
        let images = (service && showMarkers ? service.images(projection) : []);

        images = filterImages(images);
        sequences = filterSequences(sequences, service);

        service.filterViewer(context);

        let traces = layer.selectAll('.sequences').selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.id; });

        // exit
        traces.exit()
            .remove();

        // enter/update
        traces = traces.enter()
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

        // update
        const markers = groups
            .merge(groupsEnter)
            .sort(function(a, b) {
                return b.loc[1] - a.loc[1];  // sort Y
            })
            .attr('transform', transform)
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

        viewfields.enter()               // viewfields may or may not be drawn...
            .insert('path', 'circle')    // but if they are, draw below the circles
            .attr('class', 'viewfield')
            .classed('pano', function() { return this.parentNode.__data__.is_pano; })
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            if (this.parentNode.__data__.is_pano) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }
    }


    function drawImages(selection) {
        const enabled = svgMapillaryImages.enabled;
        const service = getService();

        layer = selection.selectAll('.layer-mapillary')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary')
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
                update();
                service.loadImages(projection);
            } else {
                editOff();
            }
        }
    }


    drawImages.enabled = function(_) {
        if (!arguments.length) return svgMapillaryImages.enabled;
        svgMapillaryImages.enabled = _;
        if (svgMapillaryImages.enabled) {
            showLayer();
            context.photos().on('change.mapillary_images', update);
        } else {
            hideLayer();
            context.photos().on('change.mapillary_images', null);
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
