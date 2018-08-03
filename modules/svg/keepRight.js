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
        svgKeepRight.visibleErrors = [30];
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
        layer.selectAll('.kr_error').remove();
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
        var selectedID = context.selectedNoteID(); // TODO: update with selectedErrorID
        var data = (service ? service.keepRight(projection) : []);
        var visibleData =  data; // getVisible(data); // TODO: only show sub-layers that are toggled on
        var transform = svgPointTransform(projection);
        var kr_errors = layer.selectAll('.kr_error')
            .data(visibleData, function(d) { return d.id; });

        // exit
        kr_errors.exit()
            .remove();

        // enter
        var kr_errorsEnter = kr_errors.enter()
            .append('g')
            .attr('class', function(d) {
                return 'kr_error kr_error-' + d.id + ' kr_error_type_' + d.error_type; })
            .classed('new', function(d) { return d.id < 0; });

        kr_errorsEnter
            .append('ellipse')
            .attr('cx', 0.5)
            .attr('cy', 1)
            .attr('rx', 6.5)
            .attr('ry', 3)
            .attr('class', 'stroke');

        // kr_errorsEnter
        //     .append('path')
        //     .call(markerPath, 'kr_error-shadow');

        kr_errorsEnter
            .append('use')
            .attr('class', 'kr_error-fill')
            .attr('width', '20px')
            .attr('height', '20px')
            .attr('x', '-4px')
            .attr('y', '-24px')
            .attr('xlink:href', '#iD-icon-bolt');

        // update
        kr_errors
            .merge(kr_errorsEnter)
            .sort(function(a, b) {
                return (a.id === selectedID) ? 1
                    : (b.id === selectedID) ? -1
                    : b.loc[1] - a.loc[1];  // sort Y
            })
            .classed('selected', function(d) { return d.id === selectedID; })
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

        function exampleCallback(value1, value2, value3) { // TODO: rename, possibly remove function
        }

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                var options = { // TODO: change out these options and place as default
                    ch: [0,30,40,50,70,90,100,110,120,130,150,160,170,180,191,192,193,194,195,196,197,198,201,202,203,204,205,206,207,208,210,220,231,232,270,281,282,283,284,285,291,292,293,294,295,296,297,298,311,312,313,320,350,370,380,401,402,411,412,413]
                };

                service.loadKeepRight(context, projection, options, exampleCallback);
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


    drawKeepRight.visibleErrors = function(_) {
        if (!arguments.length) return svgKeepRight.visibleErrors;
        svgKeepRight.visibleErrors.push(_);
        if (svgKeepRight.visibleErrors) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };



    init();
    return drawKeepRight;
}
