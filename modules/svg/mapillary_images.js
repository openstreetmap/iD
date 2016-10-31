import * as d3 from 'd3';
import _ from 'lodash';
import { svgPointTransform } from './point_transform';
import { services } from '../services/index';


export function svgMapillaryImages(projection, context, dispatch) {
    var throttledRedraw = _.throttle(function () { dispatch.call('change'); }, 1000),
        minZoom = 12,
        minViewfieldZoom = 16,
        layer = d3.select(null),
        _mapillary;


    function init() {
        if (svgMapillaryImages.initialized) return;  // run once
        svgMapillaryImages.enabled = false;
        svgMapillaryImages.initialized = true;
    }


    function getMapillary() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('loadedImages', throttledRedraw);
        } else if (!services.mapillary && _mapillary) {
            _mapillary = null;
        }

        return _mapillary;
    }


    function showLayer() {
        var mapillary = getMapillary();
        if (!mapillary) return;

        mapillary.loadViewer(context);
        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }


    function hideLayer() {
        var mapillary = getMapillary();
        if (mapillary) {
            mapillary.hideViewer();
        }

        throttledRedraw.cancel();

        layer
            .transition()
            .duration(500)
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
        var mapillary = getMapillary();
        if (!mapillary) return;

        context.map().centerEase(d.loc);

        mapillary
            .selectedImage(d.key, true)
            .updateViewer(d.key, context)
            .showViewer();
    }


    function transform(d) {
        var t = svgPointTransform(projection)(d);
        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        return t;
    }


    function update() {
        var mapillary = getMapillary(),
            data = (mapillary ? mapillary.images(projection) : []),
            imageKey = mapillary ? mapillary.selectedImage() : null;

        var markers = layer.selectAll('.viewfield-group')
            .data(data, function(d) { return d.key; });

        markers.exit()
            .remove();

        var enter = markers.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .classed('selected', function(d) { return d.key === imageKey; })
            .on('click', click);

        markers = markers
            .merge(enter)
            .attr('transform', transform);


       var viewfields = markers.selectAll('.viewfield')
            .data(~~context.map().zoom() >= minViewfieldZoom ? [0] : []);

        viewfields.exit()
            .remove();

        viewfields.enter()
            .append('path')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');

        markers.selectAll('circle')
            .data([0])
            .enter()
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '6');
    }


    function drawImages(selection) {
        var enabled = svgMapillaryImages.enabled,
            mapillary = getMapillary();

        layer = selection.selectAll('.layer-mapillary-images')
            .data(mapillary ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-images')
            .style('display', enabled ? 'block' : 'none')
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
        return !!getMapillary();
    };


    init();
    return drawImages;
}
