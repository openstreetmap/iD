import _throttle from 'lodash-es/throttle';

import {
    geoIdentity as d3_geoIdentity,
    geoPath as d3_geoPath
} from 'd3-geo';

import { select as d3_select } from 'd3-selection';

import { svgPointTransform } from './point_transform';
import { services } from '../services';


export function svgMapillaryImages(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000),
        minZoom = 12,
        minMarkerZoom = 16,
        minViewfieldZoom = 18,
        layer = d3_select(null),
        _mapillary;


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
        var service = getService();
        if (!service) return;

        service.loadViewer(context);
        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }


    function hideLayer() {
        var service = getService();
        if (service) {
            service.hideViewer();
        }

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

        context.map().centerEase(d.loc);

        service
            .selectImage(d)
            .updateViewer(d.key, context)
            .showViewer();
    }


    function mouseover(d) {
        var service = getService();
        if (service) service.setStyles(d);
    }


    function mouseout() {
        var service = getService();
        if (service) service.setStyles(null);
    }


    function transform(d) {
        var t = svgPointTransform(projection)(d);
        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        return t;
    }


    function update() {
        var z = ~~context.map().zoom();
        var showMarkers = (z >= minMarkerZoom);
        var showViewfields = (z >= minViewfieldZoom);

        var service = getService();
        var sequences = (service ? service.sequences(projection) : []);
        var images = (service && showMarkers ? service.images(projection) : []);

        var clip = d3_geoIdentity().clipExtent(projection.clipExtent()).stream;
        var project = projection.stream;
        var makePath = d3_geoPath().projection({ stream: function(output) {
            return project(clip(output));
        }});

        var traces = layer.selectAll('.sequences').selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.key; });

        traces.exit()
            .remove();

        traces = traces.enter()
            .append('path')
            .attr('class', 'sequence')
            .merge(traces);

        traces
            .attr('d', makePath);


        var markers = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(images, function(d) { return d.key; });

        markers.exit()
            .remove();

        var enter = markers.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', click);

        markers = markers
            .merge(enter)
            .attr('transform', transform);


       var viewfields = markers.selectAll('.viewfield')
            .data(showViewfields ? [0] : []);

        viewfields.exit()
            .remove();

        viewfields.enter()
            .append('path')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', viewfieldPath);

        markers.selectAll('circle')
            .data([0])
            .enter()
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '6');

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
        var enabled = svgMapillaryImages.enabled,
            mapillary = getService();

        layer = selection.selectAll('.layer-mapillary-images')
            .data(mapillary ? [0] : []);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-images')
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
            if (mapillary && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                mapillary.loadImages(projection);
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
