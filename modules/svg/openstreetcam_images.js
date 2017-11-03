import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './point_transform';
import { services } from '../services';


export function svgOpenstreetcamImages(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000),
        minZoom = 12,
        minViewfieldZoom = 17,
        layer = d3_select(null),
        _openstreetcam;


    function init() {
        if (svgOpenstreetcamImages.initialized) return;  // run once
        svgOpenstreetcamImages.enabled = false;
        svgOpenstreetcamImages.initialized = true;
    }


    function getOpenstreetcam() {
        if (services.openstreetcam && !_openstreetcam) {
            _openstreetcam = services.openstreetcam;
            _openstreetcam.event.on('loadedImages', throttledRedraw);
        } else if (!services.openstreetcam && _openstreetcam) {
            _openstreetcam = null;
        }

        return _openstreetcam;
    }


    function showLayer() {
        var openstreetcam = getOpenstreetcam();
        if (!openstreetcam) return;

        openstreetcam.loadViewer(context);
        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }


    function hideLayer() {
        var openstreetcam = getOpenstreetcam();
        if (openstreetcam) {
            openstreetcam.hideViewer();
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
        var openstreetcam = getOpenstreetcam();
        if (!openstreetcam) return;

        context.map().centerEase(d.loc);

        openstreetcam
            .selectedImage(d.key)
            .updateViewer(d.imagePath)
            .showViewer();
    }


    function transform(d) {
        var t = svgPointTransform(projection)(d);
        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        return t;
    }


    function update() {
        var openstreetcam = getOpenstreetcam(),
            data = (openstreetcam ? openstreetcam.images(projection) : []),
            imageKey = openstreetcam ? openstreetcam.selectedImage() : null;

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
        var enabled = svgOpenstreetcamImages.enabled,
            openstreetcam = getOpenstreetcam();

        layer = selection.selectAll('.layer-openstreetcam-images')
            .data(openstreetcam ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-openstreetcam-images')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);

        if (enabled) {
            if (openstreetcam && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                openstreetcam.loadImages(projection);
            } else {
                editOff();
            }
        }
    }


    drawImages.enabled = function(_) {
        if (!arguments.length) return svgOpenstreetcamImages.enabled;
        svgOpenstreetcamImages.enabled = _;
        if (svgOpenstreetcamImages.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };


    drawImages.supported = function() {
        return !!getOpenstreetcam();
    };


    init();
    return drawImages;
}
