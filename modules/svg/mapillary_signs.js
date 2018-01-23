import _some from 'lodash-es/some';
import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { services } from '../services';


export function svgMapillarySigns(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _mapillary;


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
        var service = getService();
        if (!service) return;

        service.loadViewer(context);
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


    function click(d) {
        var service = getService();
        if (!service) return;

        context.map().centerEase(d.loc);

        var selected = service.getSelectedImage();
        var selectedImageKey = selected && selected.key;
        var imageKey;

        // Pick one of the images the sign was detected in,
        // preference given to an image already selected.
        d.detections.forEach(function(detection) {
            if (!imageKey || selectedImageKey === detection.image_key) {
                imageKey = detection.image_key;
            }
        });

        service
            .selectImage(null, imageKey)
            .updateViewer(imageKey, context)
            .showViewer();
    }


    function update() {
        var service = getService();
        var data = (service ? service.signs(projection) : []);
        var viewer = d3_select('#photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();
        var selectedImageKey = selected && selected.key;

        var signs = layer.selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        signs.exit()
            .remove();

        var enter = signs.enter()
            .append('foreignObject')
            .attr('class', 'icon-sign')
            .attr('width', '24px')      // for Firefox
            .attr('height', '24px')     // for Firefox
            .classed('selected', function(d) {
                return _some(d.detections, function(detection) {
                    return detection.image_key === selectedImageKey;
                });
            })
            .on('click', click);

        enter
            .append('xhtml:body')
            .attr('class', 'icon-sign-body')
            .html(service.signHTML);

        signs
            .merge(enter)
            .attr('x', function(d) { return projection(d.loc)[0] - 12; })   // offset by -12px to
            .attr('y', function(d) { return projection(d.loc)[1] - 12; });  // center signs on loc
    }


    function drawSigns(selection) {
        var enabled = svgMapillarySigns.enabled,
            service = getService();

        layer = selection.selectAll('.layer-mapillary-signs')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-signs')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                service.loadSigns(context, projection);
            } else {
                editOff();
            }
        }
    }


    drawSigns.enabled = function(_) {
        if (!arguments.length) return svgMapillarySigns.enabled;
        svgMapillarySigns.enabled = _;
        if (svgMapillarySigns.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };


    drawSigns.supported = function() {
        var service = getService();
        return (service && service.signsSupported());
    };


    init();
    return drawSigns;
}
