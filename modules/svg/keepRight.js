import _some from 'lodash-es/some';
import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './index';
import { services } from '../services';


export function svgKeepRight(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _keepRight;


    function init() {
        if (svgKeepRight.initialized) return;  // run once
        svgKeepRight.enabled = false;
        svgKeepRight.initialized = true;
    }


    function getService() {
        if (services.keepRight && !_keepRight) {
            _keepRight = services.keepRight;
            _keepRight.event.on('loadedKeepRight', throttledRedraw);
        } else if (!services.keepRight && _keepRight) {
            _keepRight = null;
        }
        return _keepRight;
    }


    function showLayer() {
        var service = getService();
        if (!service) return;
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
        console.log('TAH - keepRight.update()');
        return;
        var service = getService();
        var data = (service ? service.signs(projection) : []);
        var viewer = d3_select('#photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();
        var selectedImageKey = selected && selected.key;
        var transform = svgPointTransform(projection);

        var signs = layer.selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        // exit
        signs.exit()
            .remove();

        // enter
        var enter = signs.enter()
            .append('use')
            .attr('class', 'icon-sign')
            .attr('width', '24px')
            .attr('height', '24px')
            .attr('x', '-12px')
            .attr('y', '-12px')
            .attr('xlink:href', function(d) { return '#' + d.value; })
            .classed('selected', function(d) {
                return _some(d.detections, function(detection) {
                    return detection.image_key === selectedImageKey;
                });
            })
            .on('click', click);

        // update
        signs
            .merge(enter)
            .sort(function(a, b) {
                return (a === selected) ? 1
                    : (b === selected) ? -1
                    : b.loc[1] - a.loc[1];  // sort Y
            })
            .attr('transform', transform);
    }


    function drawKeepRight(selection) {
        var enabled = svgKeepRight.enabled;
        var service = getService();

        layer = selection.selectAll('.layer-keepRight')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-keepRight')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                var options = {
                    ch: ['30', ]
                };
                service.loadKeepRight(context, projection, options);
            } else {
                editOff();
            }
        }
    }


    drawKeepRight.enabled = function(_) {
        if (!arguments.length) return svgKeepRight.enabled;
        svgKeepRight.enabled = _;
        if (svgKeepRight.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };


    drawKeepRight.supported = function() {
        return !!getService();
    };


    init();
    return drawKeepRight;
}
