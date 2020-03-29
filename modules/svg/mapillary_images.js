import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
import { services } from '../services';


export function svgMapillaryImages(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var minMarkerZoom = 16;
    var minViewfieldZoom = 18;
    var layer = d3_select(null);
    var _mapillary;
    var viewerCompassAngle;


    function init() {
        if (svgMapillaryImages.initialized) return;  // run once
        svgMapillaryImages.enabled = false;
        svgMapillaryImages.initialized = true;
    }


    function getService() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('loadedImages', throttledRedraw);
            _mapillary.event.on('bearingChanged', function(e) {
                viewerCompassAngle = e;

                // avoid updating if the map is currently transformed
                // e.g. during drags or easing.
                if (context.map().isTransformed()) return;

                layer.selectAll('.viewfield-group.currentView')
                    .filter(function(d) {
                        return d.pano;
                    })
                    .attr('transform', transform);
            });
        } else if (!services.mapillary && _mapillary) {
            _mapillary = null;
        }

        return _mapillary;
    }


    function showLayer() {
        var service = getService();
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


    function click(d) {
        var service = getService();
        if (!service) return;

        service
            .selectImage(context, d.key)
            .updateViewer(context, d.key)
            .showViewer(context);

        context.map().centerEase(d.loc);
    }


    function mouseover(d) {
        var service = getService();
        if (service) service.setStyles(context, d);
    }


    function mouseout() {
        var service = getService();
        if (service) service.setStyles(context, null);
    }


    function transform(d) {
        var t = svgPointTransform(projection)(d);
        if (d.pano && viewerCompassAngle !== null && isFinite(viewerCompassAngle)) {
            t += ' rotate(' + Math.floor(viewerCompassAngle) + ',0,0)';
        } else if (d.ca) {
            t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        }
        return t;
    }

    context.photos().on('change.mapillary_images', update);

    function filterImages(images) {
        var showsPano = context.photos().showsPanoramic();
        var showsFlat = context.photos().showsFlat();
        if (!showsPano || !showsFlat) {
            images = images.filter(function(image) {
                if (image.pano) return showsPano;
                return showsFlat;
            });
        }
        return images;
    }

    function filterSequences(sequences, service) {
        var showsPano = context.photos().showsPanoramic();
        var showsFlat = context.photos().showsFlat();
        if (!showsPano || !showsFlat) {
            sequences = sequences.filter(function(sequence) {
                if (sequence.properties.hasOwnProperty('pano')) {
                    if (sequence.properties.pano) return showsPano;
                    return showsFlat;
                } else {
                    // if the sequence doesn't specify pano or not, search its images
                    var cProps = sequence.properties.coordinateProperties;
                    if (cProps && cProps.image_keys && cProps.image_keys.length > 0) {
                        for (var index in cProps.image_keys) {
                            var imageKey = cProps.image_keys[index];
                            var image = service.cachedImage(imageKey);
                            if (image && image.hasOwnProperty('pano')) {
                                if (image.pano) return showsPano;
                                return showsFlat;
                            }
                        }
                    }
                }
            });
        }
        return sequences;
    }

    function update() {

        var z = ~~context.map().zoom();
        var showMarkers = (z >= minMarkerZoom);
        var showViewfields = (z >= minViewfieldZoom);

        var service = getService();
        var selectedKey = service && service.getSelectedImageKey();
        var sequences = (service ? service.sequences(projection) : []);
        var images = (service && showMarkers ? service.images(projection) : []);

        images = filterImages(images);
        sequences = filterSequences(sequences, service);

        var traces = layer.selectAll('.sequences').selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.key; });

        // exit
        traces.exit()
            .remove();

        // enter/update
        traces = traces.enter()
            .append('path')
            .attr('class', 'sequence')
            .merge(traces)
            .attr('d', svgPath(projection).geojson);


        var groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(images, function(d) { return d.key; });

        // exit
        groups.exit()
            .remove();

        // enter
        var groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .on('mouseenter', mouseover)
            .on('mouseleave', mouseout)
            .on('click', click);

        groupsEnter
            .append('g')
            .attr('class', 'viewfield-scale');

        // update
        var markers = groups
            .merge(groupsEnter)
            .sort(function(a, b) {
                return (a.key === selectedKey) ? 1
                    : (b.key === selectedKey) ? -1
                    : b.loc[1] - a.loc[1];  // sort Y
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

        var viewfields = markers.selectAll('.viewfield')
            .data(showViewfields ? [0] : []);

        viewfields.exit()
            .remove();

        viewfields.enter()               // viewfields may or may not be drawn...
            .insert('path', 'circle')    // but if they are, draw below the circles
            .attr('class', 'viewfield')
            .classed('pano', function() { return this.parentNode.__data__.pano; })
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            var d = this.parentNode.__data__;
            if (d.pano) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }
    }


    function drawImages(selection) {
        var enabled = svgMapillaryImages.enabled;
        var service = getService();

        layer = selection.selectAll('.layer-mapillary')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
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
        } else {
            hideLayer();
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
